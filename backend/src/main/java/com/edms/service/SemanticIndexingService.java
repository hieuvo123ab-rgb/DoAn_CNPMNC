package com.edms.service;

import com.edms.config.SemanticConfig;
import com.edms.entity.DocumentSemanticChunk;
import com.edms.entity.DocumentVersion;
import com.edms.model.ExtractionStatus;
import com.edms.model.OcrStatus;
import com.edms.model.SemanticStatus;
import com.edms.repository.DocumentSemanticChunkRepository;
import com.edms.repository.DocumentVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Phase 12D: Semantic indexing pipeline.
 *
 * Flow:
 *   chooseSemanticText(version) → chunkText(text) → embed each chunk → persist chunks → update semanticStatus
 *
 * TRANSACTION SAFETY:
 *   Core document persistence is NOT affected by semantic indexing.
 *   If indexing fails → semanticStatus = FAILED. Lexical search unaffected.
 *
 * BOUNDED EXECUTOR:
 *   Max 2 threads, bounded queue of 200 tasks. No unbounded growth.
 *
 * PRIVACY: Raw text is never logged at INFO level.
 */
@Service
public class SemanticIndexingService {

    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentSemanticChunkRepository chunkRepository;
    private final LocalEmbeddingService embeddingService;
    private final SemanticConfig config;

    // Bounded executor: max 2 threads, queue 200, discard-oldest on overflow
    private final ExecutorService executor = new ThreadPoolExecutor(
            1, 2,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(200),
            r -> {
                Thread t = new Thread(r, "edms-semantic-idx");
                t.setDaemon(true);
                return t;
            },
            new ThreadPoolExecutor.DiscardOldestPolicy()
    );

    public SemanticIndexingService(DocumentVersionRepository documentVersionRepository,
                                    DocumentSemanticChunkRepository chunkRepository,
                                    LocalEmbeddingService embeddingService,
                                    SemanticConfig config) {
        this.documentVersionRepository = documentVersionRepository;
        this.chunkRepository = chunkRepository;
        this.embeddingService = embeddingService;
        this.config = config;
    }

    /**
     * Queue asynchronous semantic indexing for a document version.
     * Does not block the calling thread. Best-effort.
     */
    public void queueIndexing(Long versionId) {
        if (!embeddingService.isAvailable()) {
            return; // Semantic unavailable; skip silently
        }
        executor.submit(() -> indexVersionSafe(versionId));
    }

    /**
     * Synchronously index a version (used in tests and admin rebuild).
     */
    @Transactional
    public void indexVersionSync(Long versionId) {
        indexVersionSafe(versionId);
    }

    private void indexVersionSafe(Long versionId) {
        try {
            indexVersion(versionId);
        } catch (Exception e) {
            // Mark failed; do not propagate — core persistence is unaffected
            try {
                markFailed(versionId, e.getMessage());
            } catch (Exception ex) {
                // ignore
            }
        }
    }

    @Transactional
    public void indexVersion(Long versionId) {
        DocumentVersion version = documentVersionRepository.findById(versionId).orElse(null);
        if (version == null) return;

        // Choose text source (Phase 10/11 semantics)
        String text = chooseSemanticText(version);
        if (text == null || text.isBlank()) {
            version.setSemanticStatus(SemanticStatus.SKIPPED);
            version.setSemanticModel(config.getModelId());
            version.setSemanticChunkCount(0);
            version.setSemanticIndexedAt(Instant.now());
            documentVersionRepository.save(version);
            return;
        }

        if (!embeddingService.isAvailable()) {
            version.setSemanticStatus(SemanticStatus.SKIPPED);
            version.setSemanticError("Embedding model unavailable");
            documentVersionRepository.save(version);
            return;
        }

        // Mark as PENDING
        version.setSemanticStatus(SemanticStatus.PENDING);
        version.setSemanticModel(config.getModelId());
        documentVersionRepository.save(version);

        // Chunk the text
        List<String> chunks = chunkText(text);

        // Delete old chunks for this version + model (replace strategy)
        chunkRepository.deleteByDocumentVersionIdAndEmbeddingModel(versionId, config.getModelId());

        // Embed each chunk and persist
        List<DocumentSemanticChunk> newChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            String hash = sha256Hex(chunkText);

            float[] embedding = embeddingService.embedPassage(chunkText);
            byte[] embBytes = LocalEmbeddingService.floatArrayToBytes(embedding);

            DocumentSemanticChunk chunk = new DocumentSemanticChunk(
                    versionId, i, chunkText, embBytes,
                    config.getModelId(), config.getEmbeddingDimension(), hash
            );
            newChunks.add(chunk);
        }
        chunkRepository.saveAll(newChunks);

        // Mark READY on fresh entity to avoid overwriting concurrent signature updates
        documentVersionRepository.findById(versionId).ifPresent(v -> {
            v.setSemanticStatus(SemanticStatus.READY);
            v.setSemanticChunkCount(newChunks.size());
            v.setSemanticIndexedAt(Instant.now());
            v.setSemanticError(null);
            documentVersionRepository.save(v);
        });
    }

    @Transactional
    public void markFailed(Long versionId, String error) {
        documentVersionRepository.findById(versionId).ifPresent(v -> {
            v.setSemanticStatus(SemanticStatus.FAILED);
            String truncatedError = (error != null && error.length() > 490) ? error.substring(0, 490) + "..." : error;
            v.setSemanticError(truncatedError);
            documentVersionRepository.save(v);
        });
    }

    /**
     * Choose the best available text for semantic embedding.
     * Reuses Phase 10/11 content source selection logic:
     * 1. Native extraction if READY and meaningful (>= minTextChars)
     * 2. OCR text if READY and non-blank
     * 3. null → SKIPPED
     *
     * Never concatenates both sources to avoid duplicate content noise.
     * PRIVACY: returned text never logged at INFO level.
     */
    public String chooseSemanticText(DocumentVersion version) {
        String nativeText = version.getExtractedText();
        boolean hasNative = version.getExtractionStatus() == ExtractionStatus.READY
                && nativeText != null
                && nativeText.strip().length() >= config.getMinTextChars();

        if (hasNative) {
            return nativeText;
        }

        String ocrText = version.getOcrText();
        boolean hasOcr = version.getOcrStatus() == OcrStatus.READY
                && ocrText != null
                && !ocrText.isBlank();

        if (hasOcr) {
            return ocrText;
        }

        return null;
    }

    /**
     * Split text into overlapping chunks.
     * Strategy: character-based split on whitespace boundaries near chunkSize.
     * Overlap of chunkOverlap characters from end of previous chunk.
     *
     * Config: SEMANTIC_CHUNK_SIZE (default 1000), SEMANTIC_CHUNK_OVERLAP (default 150)
     */
    public List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        int size = config.getChunkSize();
        int overlap = config.getChunkOverlap();
        text = text.strip();

        if (text.length() <= size) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + size, text.length());

            // Try to snap end to a whitespace boundary
            if (end < text.length()) {
                int wsIdx = text.lastIndexOf(' ', end);
                if (wsIdx > start + size / 2) {
                    end = wsIdx;
                }
            }

            String chunk = text.substring(start, end).strip();
            if (!chunk.isBlank()) {
                chunks.add(chunk);
            }

            // Advance with overlap
            start = end - overlap;
            if (start <= 0 || start >= text.length()) break;
        }

        return chunks;
    }

    /**
     * SHA-256 hex digest of text (UTF-8). Used for dedup/skip optimization.
     * PRIVACY: not logged.
     */
    public String sha256Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "hash-error";
        }
    }
}
