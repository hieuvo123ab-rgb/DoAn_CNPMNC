package com.edms.service;

import com.edms.config.SemanticConfig;
import com.edms.entity.*;
import com.edms.model.SemanticStatus;
import com.edms.repository.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Phase 12F: Semantic search service with strict ACL-before-scoring.
 *
 * CRITICAL SECURITY INVARIANT:
 *   Step 1: Determine authorized document IDs using ACL + lifecycle predicates.
 *   Step 2: Load semantic chunks ONLY for authorized document versions.
 *   Step 3: Compute cosine similarity.
 *   Private/unauthorized document embeddings NEVER participate in scoring.
 *
 * This ensures zero existence leakage for private documents.
 */
@Service
public class SemanticSearchService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentSemanticChunkRepository chunkRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final UserRepository userRepository;
    private final LocalEmbeddingService embeddingService;
    private final SemanticConfig config;

    public SemanticSearchService(DocumentRepository documentRepository,
                                  DocumentVersionRepository documentVersionRepository,
                                  DocumentSemanticChunkRepository chunkRepository,
                                  DocumentPermissionRepository documentPermissionRepository,
                                  UserRepository userRepository,
                                  LocalEmbeddingService embeddingService,
                                  SemanticConfig config) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.chunkRepository = chunkRepository;
        this.documentPermissionRepository = documentPermissionRepository;
        this.userRepository = userRepository;
        this.embeddingService = embeddingService;
        this.config = config;
    }

    /**
     * Result record for a semantic or hybrid search hit.
     * Does NOT expose raw embedding or full chunk text.
     */
    public static class SemanticSearchResult {
        public final Long documentId;
        public final double semanticScore;
        public final String matchSnippet; // <= 300 chars, plain text
        public final String matchSource;  // NATIVE or OCR

        public SemanticSearchResult(Long documentId, double semanticScore, String matchSnippet, String matchSource) {
            this.documentId = documentId;
            this.semanticScore = semanticScore;
            this.matchSnippet = matchSnippet;
            this.matchSource = matchSource;
        }
    }

    /**
     * Returns true if the embedding model is available and query is valid for semantic search.
     */
    public boolean isAvailable(String query) {
        if (!embeddingService.isAvailable()) return false;
        if (query == null) return false;
        String trimmed = query.trim();
        return trimmed.length() >= config.getMinQueryChars() && trimmed.length() <= config.getMaxQueryChars();
    }

    /**
     * Validate query length. Throws IllegalArgumentException for invalid queries (→ 400).
     */
    public void validateQuery(String query) {
        if (query == null || query.trim().length() < config.getMinQueryChars()) {
            throw new IllegalArgumentException(
                "Truy vấn tìm kiếm ngữ nghĩa quá ngắn (tối thiểu " + config.getMinQueryChars() + " ký tự)");
        }
        if (query.trim().length() > config.getMaxQueryChars()) {
            throw new IllegalArgumentException(
                "Truy vấn tìm kiếm ngữ nghĩa quá dài (tối đa " + config.getMaxQueryChars() + " ký tự)");
        }
    }

    /**
     * Validate topK. Throws IllegalArgumentException (→ 400) for invalid values.
     */
    public int validateTopK(Integer topK) {
        if (topK == null) return config.getTopKDefault();
        if (topK < 1 || topK > config.getTopKMax()) {
            throw new IllegalArgumentException(
                "topK phải trong khoảng 1–" + config.getTopKMax() + ". Giá trị nhận được: " + topK);
        }
        return topK;
    }

    /**
     * Perform semantic search.
     *
     * ACL-before-scoring is enforced:
     *   1. Authorized document IDs determined via JPA predicates (same logic as lexical ACL)
     *   2. Current version IDs loaded only for authorized docs
     *   3. Chunks loaded only for those version IDs
     *   4. Cosine similarity computed
     *   5. Aggregated by MAX score per document
     *
     * @param query      Search query (validated)
     * @param username   Authenticated user
     * @param isAdmin    True if user has ADMIN role
     * @param topK       Max results to return
     * @return Ranked list of semantic results (documents only, deduplicated)
     */
    @Transactional(readOnly = true)
    public List<SemanticSearchResult> search(String query, String username, boolean isAdmin, int topK) {
        if (!embeddingService.isAvailable()) {
            return List.of();
        }

        // Step 1: ACL-filter — determine authorized document IDs
        // Uses same predicate logic as DocumentService.buildSearchSpec
        List<Document> authorizedDocs = getAuthorizedDocuments(username, isAdmin);
        if (authorizedDocs.isEmpty()) return List.of();

        // Map document ID → document (for score aggregation)
        Map<Long, Document> docById = authorizedDocs.stream()
                .collect(Collectors.toMap(Document::getId, d -> d));

        // Map document ID → current version ID
        Map<Long, Long> docIdToVersionId = new HashMap<>();
        for (Document doc : authorizedDocs) {
            Integer currentVer = doc.getCurrentVersionNumber();
            if (currentVer == null) continue;
            documentVersionRepository
                    .findByDocumentIdAndVersionNumber(doc.getId(), currentVer)
                    .ifPresent(v -> {
                        // Only include if semantic index is READY and matches current model
                        if (v.getSemanticStatus() == SemanticStatus.READY
                                && config.getModelId().equals(v.getSemanticModel())) {
                            docIdToVersionId.put(doc.getId(), v.getId());
                        }
                    });
        }

        if (docIdToVersionId.isEmpty()) return List.of();

        // Step 2: Load chunks ONLY for authorized version IDs (ACL already enforced above)
        List<Long> authorizedVersionIds = new ArrayList<>(docIdToVersionId.values());
        List<DocumentSemanticChunk> allChunks = chunkRepository
                .findByDocumentVersionIdInAndEmbeddingModel(authorizedVersionIds, config.getModelId());

        if (allChunks.isEmpty()) return List.of();

        // Step 3: Embed query locally (no network call)
        float[] queryVector = embeddingService.embedQuery(query.trim());

        // Step 4: Compute cosine similarity per chunk
        // Map versionId → documentId (reverse lookup)
        Map<Long, Long> versionToDocId = new HashMap<>();
        for (Map.Entry<Long, Long> entry : docIdToVersionId.entrySet()) {
            versionToDocId.put(entry.getValue(), entry.getKey());
        }

        // Aggregate MAX score per documentId
        Map<Long, Double> docMaxScore = new HashMap<>();
        Map<Long, String> docBestSnippet = new HashMap<>();
        Map<Long, String> docMatchSource = new HashMap<>();

        for (DocumentSemanticChunk chunk : allChunks) {
            Long docId = versionToDocId.get(chunk.getDocumentVersionId());
            if (docId == null) continue;

            byte[] embBytes = chunk.getEmbeddingBytes();
            if (embBytes == null || embBytes.length == 0) continue;

            float[] chunkVector = LocalEmbeddingService.bytesToFloatArray(embBytes);
            double score = LocalEmbeddingService.cosineSimilarity(queryVector, chunkVector);

            if (!docMaxScore.containsKey(docId) || score > docMaxScore.get(docId)) {
                docMaxScore.put(docId, score);
                // Build snippet from best-scoring chunk (≤ 300 chars, plain text)
                String snippet = buildSnippet(chunk.getChunkText());
                docBestSnippet.put(docId, snippet);
                // Determine content source
                Document doc = docById.get(docId);
                docMatchSource.put(docId, resolveSource(doc));
            }
        }

        // Step 5: Filter by minScore, sort by score DESC, limit topK
        double minScore = config.getMinScore();
        List<SemanticSearchResult> results = docMaxScore.entrySet().stream()
                .filter(e -> e.getValue() >= minScore)
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(topK)
                .map(e -> new SemanticSearchResult(
                        e.getKey(),
                        e.getValue(),
                        docBestSnippet.get(e.getKey()),
                        docMatchSource.get(e.getKey())
                ))
                .collect(Collectors.toList());

        return results;
    }

    /**
     * Get authorized documents using same ACL logic as DocumentService.
     * DISPOSED documents are always excluded for non-admin users.
     */
    private List<Document> getAuthorizedDocuments(String username, boolean isAdmin) {
        Specification<Document> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ACL: admin sees all, staff sees INTERNAL + owned + shared (non-disposed)
            if (!isAdmin) {
                predicates.add(cb.notEqual(root.get("lifecycleStatus"), LifecycleStatus.DISPOSED));

                if (username == null || username.isBlank() || "anonymous".equalsIgnoreCase(username)) {
                    predicates.add(cb.equal(root.get("accessMode"), AccessMode.INTERNAL));
                } else {
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    List<Long> sharedDocIds = userOpt.isPresent()
                            ? documentPermissionRepository.findDocumentIdsSharedWithUser(userOpt.get().getId())
                            : List.of();

                    Predicate internalPred = cb.equal(root.get("accessMode"), AccessMode.INTERNAL);
                    Predicate ownerPred = cb.equal(cb.lower(root.get("createdBy")), username.trim().toLowerCase());

                    if (!sharedDocIds.isEmpty()) {
                        Predicate sharedPred = root.get("id").in(sharedDocIds);
                        predicates.add(cb.or(internalPred, ownerPred, sharedPred));
                    } else {
                        predicates.add(cb.or(internalPred, ownerPred));
                    }
                }
            } else {
                // Admin: only ACTIVE and ARCHIVED for normal semantic search
                // DISPOSED excluded from normal semantic candidate set
                predicates.add(cb.notEqual(root.get("lifecycleStatus"), LifecycleStatus.DISPOSED));
            }

            cq.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return documentRepository.findAll(spec);
    }

    /**
     * Determine content source for a document based on extraction/OCR status.
     */
    private String resolveSource(Document doc) {
        if (doc == null) return "UNKNOWN";
        // Simple heuristic; actual source tracked in DocumentVersion
        return "NATIVE"; // Will be refined if OCR is source
    }

    /**
     * Build a plain-text snippet (≤ 300 chars) from chunk text.
     * NEVER called before ACL authorization.
     */
    private String buildSnippet(String chunkText) {
        if (chunkText == null || chunkText.isBlank()) return null;
        String stripped = chunkText.replaceAll("\\s+", " ").trim();
        if (stripped.length() <= 300) return stripped;
        return stripped.substring(0, 297) + "...";
    }
}
