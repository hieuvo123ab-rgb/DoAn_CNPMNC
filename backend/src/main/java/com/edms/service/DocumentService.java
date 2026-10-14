package com.edms.service;

import com.edms.dto.*;
import com.edms.entity.*;
import com.edms.exception.ResourceNotFoundException;
import com.edms.exception.WorkflowConflictException;
import com.edms.repository.DocumentPermissionRepository;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import com.edms.repository.UserRepository;
import com.edms.model.ExtractionStatus;
import com.edms.model.OcrStatus;
import com.edms.model.SearchScope;
import com.edms.model.SemanticStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final DocumentAccessService documentAccessService;
    private final UserRepository userRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentReviewService documentReviewService;
    private final DocumentDispositionService documentDispositionService;
    private final ContentExtractionService contentExtractionService;
    private final DocumentCoreService documentCoreService;
    private final OcrService ocrService;
    private final SemanticIndexingService semanticIndexingService;
    private final NotificationService notificationService;

    public DocumentService(DocumentRepository documentRepository,
                           FileStorageService fileStorageService,
                           AuditService auditService,
                           DocumentAccessService documentAccessService,
                           UserRepository userRepository,
                           DocumentPermissionRepository documentPermissionRepository,
                           DocumentVersionRepository documentVersionRepository,
                           DocumentReviewService documentReviewService,
                           DocumentDispositionService documentDispositionService,
                           ContentExtractionService contentExtractionService,
                           DocumentCoreService documentCoreService,
                           OcrService ocrService,
                           SemanticIndexingService semanticIndexingService,
                           NotificationService notificationService) {
        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
        this.auditService = auditService;
        this.documentAccessService = documentAccessService;
        this.userRepository = userRepository;
        this.documentPermissionRepository = documentPermissionRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentReviewService = documentReviewService;
        this.documentDispositionService = documentDispositionService;
        this.contentExtractionService = contentExtractionService;
        this.documentCoreService = documentCoreService;
        this.ocrService = ocrService;
        this.semanticIndexingService = semanticIndexingService;
        this.notificationService = notificationService;
    }

    private DocumentResponse toDocumentResponse(Document doc, String perm) {
        return toDocumentResponse(doc, perm, null, null);
    }

    private int indexOfIgnoreCase(String src, String target) {
        if (src == null || target == null) return -1;
        int targetLen = target.length();
        if (targetLen == 0) return 0;
        int max = src.length() - targetLen;
        for (int i = 0; i <= max; i++) {
            if (src.regionMatches(true, i, target, 0, targetLen)) {
                return i;
            }
        }
        return -1;
    }

    private String buildSnippet(String text, String q, int idx) {
        if (idx < 0) return null;
        int start = Math.max(0, idx - 60);
        int end = Math.min(text.length(), idx + q.length() + 80);
        String snippet = text.substring(start, end).replaceAll("\\s+", " ").trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < text.length()) snippet = snippet + "...";
        if (snippet.length() > 300) {
            snippet = snippet.substring(0, 300) + "...";
        }
        return snippet;
    }

    private DocumentResponse toDocumentResponse(Document doc, String perm, String query, String searchScope) {
        String reviewStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        DocumentResponse response = DocumentResponse.fromEntity(doc, perm, reviewStatus);

        int currentVerNumber = doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1;
        DocumentVersion currentVersion = documentVersionRepository
                .findByDocumentIdAndVersionNumber(doc.getId(), currentVerNumber)
                .orElse(null);

        if (currentVersion != null) {
            response.setExtractionStatus(currentVersion.getExtractionStatus() != null ? currentVersion.getExtractionStatus().name() : "PENDING");
            response.setOcrStatus(currentVersion.getOcrStatus() != null ? currentVersion.getOcrStatus().name() : "NOT_REQUIRED");
            response.setOcrCharacterCount(currentVersion.getOcrCharacterCount());
            response.setOcrAt(currentVersion.getOcrAt());

            String nativeText = currentVersion.getExtractedText();
            String ocrText = currentVersion.getOcrText();
            boolean hasNative = currentVersion.getExtractionStatus() == ExtractionStatus.READY && nativeText != null && !nativeText.isBlank();
            boolean hasOcr = currentVersion.getOcrStatus() == OcrStatus.READY && ocrText != null && !ocrText.isBlank();

            if (hasNative) {
                response.setContentSource("NATIVE");
            } else if (hasOcr) {
                response.setContentSource("OCR");
            } else {
                response.setContentSource("NONE");
            }

            if (query != null && !query.isBlank() && !"METADATA".equalsIgnoreCase(searchScope)) {
                String q = query.trim();
                int nativeIdx = hasNative ? indexOfIgnoreCase(nativeText, q) : -1;
                int ocrIdx = hasOcr ? indexOfIgnoreCase(ocrText, q) : -1;

                if (hasNative && nativeIdx >= 0) {
                    response.setContentMatched(true);
                    response.setContentSource("NATIVE");
                    response.setMatchSnippet(buildSnippet(nativeText, q, nativeIdx));
                } else if (hasOcr && ocrIdx >= 0) {
                    response.setContentMatched(true);
                    response.setContentSource("OCR");
                    response.setMatchSnippet(buildSnippet(ocrText, q, ocrIdx));
                }
            }
        }

        return response;
    }

    public DocumentResponse uploadDocument(MultipartFile file, DocumentMetadataRequest metadata, String username) {
        return uploadDocument(file, metadata, username, false, false);
    }

    public DocumentResponse uploadDocument(MultipartFile file, DocumentMetadataRequest metadata, String username, boolean forceExtractionFailure) {
        return uploadDocument(file, metadata, username, forceExtractionFailure, false);
    }

    public DocumentResponse uploadDocument(MultipartFile file, DocumentMetadataRequest metadata, String username, boolean forceExtractionFailure, boolean syncOcr) {
        return uploadDocument(file, metadata, username, forceExtractionFailure, syncOcr, false);
    }

    public DocumentResponse uploadDocument(MultipartFile file, DocumentMetadataRequest metadata, String username, boolean forceExtractionFailure, boolean syncOcr, boolean forceOcrTimeout) {
        Document savedDoc = documentCoreService.createDocumentAndVersion1(file, metadata, username);
        // Core transaction committed to PostgreSQL!
        Long v1Id = documentVersionRepository.findByDocumentIdAndVersionNumber(savedDoc.getId(), 1)
                .map(DocumentVersion::getId)
                .orElse(null);
        if (v1Id != null) {
            try {
                contentExtractionService.extractAndSaveById(v1Id, forceExtractionFailure);
            } catch (Throwable e) {
                // Best-effort extraction: core document persistence is durable
            }
            try {
                ocrService.evaluateAndQueueOcr(v1Id, syncOcr, forceOcrTimeout);
            } catch (Throwable e) {
                // Best-effort OCR
            }
            try {
                // Phase 12: Best-effort semantic indexing after content is available
                semanticIndexingService.queueIndexing(v1Id);
            } catch (Throwable e) {
                // Best-effort semantic indexing; does NOT rollback core document
            }
        }

        return toDocumentResponse(savedDoc, "OWNER");
    }

    @Transactional(readOnly = true)
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + id));
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentResponseById(Long id, String username, boolean isAdmin) {
        Document doc = getDocumentById(id);
        documentAccessService.requireRead(doc, username, isAdmin);
        String perm = documentAccessService.getUserPermissionLevel(doc, username, isAdmin);
        return toDocumentResponse(doc, perm);
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long documentId, String username, boolean isAdmin) {
        Document doc = getDocumentById(documentId);
        documentAccessService.requireRead(doc, username, isAdmin);
        return fileStorageService.loadFileAsResource(doc.getStoredFileName());
    }

    private Specification<Document> buildSearchSpec(String currentUsername, boolean isAdmin, String ownerFilter, String query, String documentType, String lifecycleStatus, String searchScope) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. ACL filtering: If not admin, restrict to INTERNAL, Owned, or Explicitly Shared
            if (!isAdmin) {
                if (currentUsername == null || currentUsername.isBlank() || "anonymous".equalsIgnoreCase(currentUsername)) {
                    predicates.add(cb.equal(root.get("accessMode"), AccessMode.INTERNAL));
                } else {
                    Optional<User> userOpt = userRepository.findByUsername(currentUsername);
                    List<Long> sharedDocIds = userOpt.isPresent()
                            ? documentPermissionRepository.findDocumentIdsSharedWithUser(userOpt.get().getId())
                            : List.of();

                    Predicate internalPred = cb.equal(root.get("accessMode"), AccessMode.INTERNAL);
                    Predicate ownerPred = cb.equal(cb.lower(root.get("createdBy")), currentUsername.trim().toLowerCase());

                    if (!sharedDocIds.isEmpty()) {
                        Predicate sharedPred = root.get("id").in(sharedDocIds);
                        predicates.add(cb.or(internalPred, ownerPred, sharedPred));
                    } else {
                        predicates.add(cb.or(internalPred, ownerPred));
                    }
                }
            }

            // 2. Owner filter (e.g. for getMyDocuments)
            if (ownerFilter != null && !ownerFilter.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("createdBy")), ownerFilter.trim().toLowerCase()));
            }

            // 3. DocumentType filter
            if (documentType != null && !documentType.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("documentType")), documentType.trim().toLowerCase()));
            }

            // 4. Keyword query filter (across title, description, originalFileName, documentType, and/or extractedText)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPred = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern);
                Predicate filePred = cb.like(cb.lower(root.get("originalFileName")), pattern);
                Predicate typePred = cb.like(cb.lower(cb.coalesce(root.get("documentType"), "")), pattern);
                Predicate metaPred = cb.or(titlePred, descPred, filePred, typePred);

                String scope = (searchScope != null && !searchScope.trim().isEmpty()) ? searchScope.trim().toUpperCase() : "METADATA";
                if ("CONTENT".equalsIgnoreCase(scope)) {
                    Subquery<Long> contentSubquery = cq.subquery(Long.class);
                    Root<DocumentVersion> dvRoot = contentSubquery.from(DocumentVersion.class);

                    Predicate nativeMatch = cb.and(
                            cb.equal(dvRoot.get("extractionStatus"), ExtractionStatus.READY),
                            cb.like(cb.lower(dvRoot.get("extractedText")), pattern)
                    );
                    Predicate ocrMatch = cb.and(
                            cb.equal(dvRoot.get("ocrStatus"), OcrStatus.READY),
                            cb.like(cb.lower(dvRoot.get("ocrText")), pattern)
                    );

                    contentSubquery.select(dvRoot.get("document").get("id"))
                            .where(
                                    cb.equal(dvRoot.get("document"), root),
                                    cb.equal(dvRoot.get("versionNumber"), root.get("currentVersionNumber")),
                                    cb.or(nativeMatch, ocrMatch)
                            );
                    predicates.add(cb.exists(contentSubquery));
                } else if ("ALL".equalsIgnoreCase(scope)) {
                    Subquery<Long> contentSubquery = cq.subquery(Long.class);
                    Root<DocumentVersion> dvRoot = contentSubquery.from(DocumentVersion.class);

                    Predicate nativeMatch = cb.and(
                            cb.equal(dvRoot.get("extractionStatus"), ExtractionStatus.READY),
                            cb.like(cb.lower(dvRoot.get("extractedText")), pattern)
                    );
                    Predicate ocrMatch = cb.and(
                            cb.equal(dvRoot.get("ocrStatus"), OcrStatus.READY),
                            cb.like(cb.lower(dvRoot.get("ocrText")), pattern)
                    );

                    contentSubquery.select(dvRoot.get("document").get("id"))
                            .where(
                                    cb.equal(dvRoot.get("document"), root),
                                    cb.equal(dvRoot.get("versionNumber"), root.get("currentVersionNumber")),
                                    cb.or(nativeMatch, ocrMatch)
                            );
                    predicates.add(cb.or(metaPred, cb.exists(contentSubquery)));
                } else {
                    predicates.add(metaPred);
                }
            }

            // 5. Lifecycle status filter
            if (!isAdmin) {
                // Normal users NEVER see DISPOSED documents
                predicates.add(cb.notEqual(root.get("lifecycleStatus"), LifecycleStatus.DISPOSED));
                if (lifecycleStatus != null && !lifecycleStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(lifecycleStatus.trim())) {
                    try {
                        LifecycleStatus statusEnum = LifecycleStatus.valueOf(lifecycleStatus.trim().toUpperCase());
                        if (statusEnum != LifecycleStatus.DISPOSED) {
                            predicates.add(cb.equal(root.get("lifecycleStatus"), statusEnum));
                        }
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            } else {
                // Admin user can filter by any lifecycle status (including DISPOSED)
                if (lifecycleStatus != null && !lifecycleStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(lifecycleStatus.trim())) {
                    try {
                        LifecycleStatus statusEnum = LifecycleStatus.valueOf(lifecycleStatus.trim().toUpperCase());
                        predicates.add(cb.equal(root.get("lifecycleStatus"), statusEnum));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }

            cq.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Document> buildSearchSpec(String currentUsername, boolean isAdmin, String ownerFilter, String query, String documentType, String lifecycleStatus) {
        return buildSearchSpec(currentUsername, isAdmin, ownerFilter, query, documentType, lifecycleStatus, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String username, boolean isAdmin, String query, String documentType) {
        return searchDocuments(username, isAdmin, query, documentType, null, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String username, boolean isAdmin, String query, String documentType, String lifecycleStatus) {
        return searchDocuments(username, isAdmin, query, documentType, lifecycleStatus, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String username, boolean isAdmin, String query, String documentType, String lifecycleStatus, String searchScope) {
        String trimmedQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String trimmedDocType = (documentType != null && !documentType.trim().isEmpty()) ? documentType.trim() : null;
        String trimmedLifecycle = (lifecycleStatus != null && !lifecycleStatus.trim().isEmpty()) ? lifecycleStatus.trim() : null;
        String effectiveScope = (searchScope != null && !searchScope.trim().isEmpty()) ? searchScope.trim().toUpperCase() : "METADATA";

        Specification<Document> spec = buildSearchSpec(username, isAdmin, null, trimmedQuery, trimmedDocType, trimmedLifecycle, effectiveScope);
        return documentRepository.findAll(spec).stream()
                .map(doc -> {
                    String perm = documentAccessService.getUserPermissionLevel(doc, username, isAdmin);
                    return toDocumentResponse(doc, perm, trimmedQuery, effectiveScope);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchMyDocuments(String username, String query, String documentType) {
        return searchMyDocuments(username, query, documentType, null, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchMyDocuments(String username, String query, String documentType, String lifecycleStatus) {
        return searchMyDocuments(username, query, documentType, lifecycleStatus, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchMyDocuments(String username, String query, String documentType, String lifecycleStatus, String searchScope) {
        String trimmedQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String trimmedDocType = (documentType != null && !documentType.trim().isEmpty()) ? documentType.trim() : null;
        String trimmedLifecycle = (lifecycleStatus != null && !lifecycleStatus.trim().isEmpty()) ? lifecycleStatus.trim() : null;
        String effectiveScope = (searchScope != null && !searchScope.trim().isEmpty()) ? searchScope.trim().toUpperCase() : "METADATA";

        Specification<Document> spec = buildSearchSpec(username, false, username, trimmedQuery, trimmedDocType, trimmedLifecycle, effectiveScope);
        return documentRepository.findAll(spec).stream()
                .map(doc -> toDocumentResponse(doc, "OWNER", trimmedQuery, effectiveScope))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getSharedWithMeDocuments(String username, String query, String documentType) {
        return getSharedWithMeDocuments(username, query, documentType, null, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getSharedWithMeDocuments(String username, String query, String documentType, String lifecycleStatus) {
        return getSharedWithMeDocuments(username, query, documentType, lifecycleStatus, "METADATA");
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getSharedWithMeDocuments(String username, String query, String documentType, String lifecycleStatus, String searchScope) {
        if (username == null || username.isBlank() || "anonymous".equalsIgnoreCase(username)) {
            return List.of();
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return List.of();
        }

        List<Long> sharedDocIds = documentPermissionRepository.findDocumentIdsSharedWithUser(userOpt.get().getId());
        if (sharedDocIds.isEmpty()) {
            return List.of();
        }

        String trimmedQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String trimmedDocType = (documentType != null && !documentType.trim().isEmpty()) ? documentType.trim() : null;
        String trimmedLifecycle = (lifecycleStatus != null && !lifecycleStatus.trim().isEmpty()) ? lifecycleStatus.trim() : null;
        String effectiveScope = (searchScope != null && !searchScope.trim().isEmpty()) ? searchScope.trim().toUpperCase() : "METADATA";

        Specification<Document> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("id").in(sharedDocIds));
            predicates.add(cb.notEqual(cb.lower(root.get("createdBy")), username.trim().toLowerCase()));

            if (trimmedDocType != null) {
                predicates.add(cb.equal(cb.lower(root.get("documentType")), trimmedDocType.toLowerCase()));
            }

            if (trimmedQuery != null) {
                String pattern = "%" + trimmedQuery.toLowerCase() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descPred = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern);
                Predicate filePred = cb.like(cb.lower(root.get("originalFileName")), pattern);
                Predicate typePred = cb.like(cb.lower(cb.coalesce(root.get("documentType"), "")), pattern);
                Predicate metaPred = cb.or(titlePred, descPred, filePred, typePred);

                if ("CONTENT".equalsIgnoreCase(effectiveScope)) {
                    Subquery<Long> contentSubquery = cq.subquery(Long.class);
                    Root<DocumentVersion> dvRoot = contentSubquery.from(DocumentVersion.class);

                    Predicate nativeMatch = cb.and(
                            cb.equal(dvRoot.get("extractionStatus"), ExtractionStatus.READY),
                            cb.like(cb.lower(dvRoot.get("extractedText")), pattern)
                    );
                    Predicate ocrMatch = cb.and(
                            cb.equal(dvRoot.get("ocrStatus"), OcrStatus.READY),
                            cb.like(cb.lower(dvRoot.get("ocrText")), pattern)
                    );

                    contentSubquery.select(dvRoot.get("document").get("id"))
                            .where(
                                    cb.equal(dvRoot.get("document"), root),
                                    cb.equal(dvRoot.get("versionNumber"), root.get("currentVersionNumber")),
                                    cb.or(nativeMatch, ocrMatch)
                            );
                    predicates.add(cb.exists(contentSubquery));
                } else if ("ALL".equalsIgnoreCase(effectiveScope)) {
                    Subquery<Long> contentSubquery = cq.subquery(Long.class);
                    Root<DocumentVersion> dvRoot = contentSubquery.from(DocumentVersion.class);

                    Predicate nativeMatch = cb.and(
                            cb.equal(dvRoot.get("extractionStatus"), ExtractionStatus.READY),
                            cb.like(cb.lower(dvRoot.get("extractedText")), pattern)
                    );
                    Predicate ocrMatch = cb.and(
                            cb.equal(dvRoot.get("ocrStatus"), OcrStatus.READY),
                            cb.like(cb.lower(dvRoot.get("ocrText")), pattern)
                    );

                    contentSubquery.select(dvRoot.get("document").get("id"))
                            .where(
                                    cb.equal(dvRoot.get("document"), root),
                                    cb.equal(dvRoot.get("versionNumber"), root.get("currentVersionNumber")),
                                    cb.or(nativeMatch, ocrMatch)
                            );
                    predicates.add(cb.or(metaPred, cb.exists(contentSubquery)));
                } else {
                    predicates.add(metaPred);
                }
            }

            predicates.add(cb.notEqual(root.get("lifecycleStatus"), LifecycleStatus.DISPOSED));
            if (trimmedLifecycle != null && !"ALL".equalsIgnoreCase(trimmedLifecycle)) {
                try {
                    LifecycleStatus statusEnum = LifecycleStatus.valueOf(trimmedLifecycle.toUpperCase());
                    if (statusEnum != LifecycleStatus.DISPOSED) {
                        predicates.add(cb.equal(root.get("lifecycleStatus"), statusEnum));
                    }
                } catch (IllegalArgumentException ignored) {}
            }

            cq.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return documentRepository.findAll(spec).stream()
                .map(doc -> {
                    String perm = documentAccessService.getUserPermissionLevel(doc, username, false);
                    return toDocumentResponse(doc, perm, trimmedQuery, effectiveScope);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentResponse updateDocument(Long id, DocumentUpdateRequest request, String username, boolean isAdmin) {
        Document document = getDocumentById(id);

        if (document.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể cập nhật thông tin");
        }
        if (document.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể cập nhật thông tin");
        }

        // Enforce EDIT authority (Owner, Admin, or shared EDIT)
        documentAccessService.requireEdit(document, username, isAdmin);

        // If accessMode is specified and changing, enforce CHANGE_ACCESS_MODE authority (Owner or Admin)
        if (request.getAccessMode() != null && !request.getAccessMode().isBlank()) {
            String newModeStr = request.getAccessMode().trim().toUpperCase();
            if (!newModeStr.equalsIgnoreCase(document.getAccessMode().name())) {
                documentAccessService.requireChangeAccessMode(document, username, isAdmin);
                try {
                    AccessMode newMode = AccessMode.valueOf(newModeStr);
                    document.setAccessMode(newMode);
                    auditService.log(username, "DOCUMENT_ACCESS_MODE_CHANGE", "DOCUMENT", document.getId().toString(),
                            username + " đổi chế độ truy cập tài liệu #" + id + " sang " + newMode.name(), null);
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Chế độ truy cập không hợp lệ: " + newModeStr);
                }
            }
        }

        document.setTitle(request.getTitle());
        document.setDescription(request.getDescription());
        document.setDocumentType(request.getDocumentType());
        document.setUpdatedAt(Instant.now());

        Document savedDoc = documentRepository.save(document);
        auditService.log(username, "DOCUMENT_UPDATE", "DOCUMENT", savedDoc.getId().toString(),
                "Cập nhật tài liệu: " + savedDoc.getTitle(), null);
        String perm = documentAccessService.getUserPermissionLevel(savedDoc, username, isAdmin);
        return toDocumentResponse(savedDoc, perm);
    }

    @Transactional
    public DocumentResponse updateAccessMode(Long id, AccessModeUpdateRequest request, String username, boolean isAdmin) {
        Document document = getDocumentById(id);

        if (document.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể thay đổi chế độ truy cập");
        }
        if (document.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể thay đổi chế độ truy cập");
        }

        documentAccessService.requireChangeAccessMode(document, username, isAdmin);

        AccessMode newMode;
        try {
            newMode = AccessMode.valueOf(request.getAccessMode().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Chế độ truy cập không hợp lệ: " + request.getAccessMode());
        }

        document.setAccessMode(newMode);
        document.setUpdatedAt(Instant.now());
        Document savedDoc = documentRepository.save(document);

        auditService.log(username, "DOCUMENT_ACCESS_MODE_CHANGE", "DOCUMENT", document.getId().toString(),
                username + " đổi chế độ truy cập tài liệu #" + id + " (" + document.getTitle() + ") sang " + newMode.name(), null);

        String perm = documentAccessService.getUserPermissionLevel(savedDoc, username, isAdmin);
        return toDocumentResponse(savedDoc, perm);
    }

    @Transactional(readOnly = true)
    public DocumentPermissionsResponse getPermissions(Long documentId, String username, boolean isAdmin) {
        Document document = getDocumentById(documentId);
        documentAccessService.requireShare(document, username, isAdmin);

        List<DocumentPermission> permissions = documentPermissionRepository.findByDocumentId(documentId);
        List<DocumentPermissionItemResponse> items = permissions.stream()
                .map(DocumentPermissionItemResponse::fromEntity)
                .collect(Collectors.toList());

        return new DocumentPermissionsResponse(
                document.getId(),
                document.getTitle(),
                document.getAccessMode().name(),
                document.getCreatedBy(),
                items
        );
    }

    @Transactional
    public DocumentPermissionItemResponse grantOrUpdatePermission(Long documentId, ShareDocumentRequest request, String username, boolean isAdmin) {
        Document document = getDocumentById(documentId);

        if (document.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể thay đổi phân quyền");
        }
        if (document.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể thay đổi phân quyền");
        }

        documentAccessService.requireShare(document, username, isAdmin);

        // Resolve target user
        User targetUser;
        if (request.getUserId() != null) {
            targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));
        } else if (request.getUsername() != null && !request.getUsername().isBlank()) {
            targetUser = userRepository.findByUsername(request.getUsername().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với tên đăng nhập: " + request.getUsername()));
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp userId hoặc username");
        }

        // Validation: Cannot share with owner
        if (targetUser.getUsername().equalsIgnoreCase(document.getCreatedBy())) {
            throw new IllegalArgumentException("Không thể chia sẻ tài liệu cho chính chủ sở hữu tài liệu");
        }

        // Validation: Cannot share with disabled user
        if (!targetUser.isEnabled()) {
            throw new IllegalArgumentException("Không thể chia sẻ tài liệu cho tài khoản đã bị vô hiệu hóa");
        }

        // Validation: Permission Type
        boolean simRollback = request.getPermission() != null && request.getPermission().toUpperCase().contains("SIMULATE_ROLLBACK");
        String cleanPermission = request.getPermission() != null ? request.getPermission().replace("_SIMULATE_ROLLBACK", "").trim() : "";
        PermissionType permissionType;
        try {
            permissionType = PermissionType.valueOf(cleanPermission.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Quyền hạn không hợp lệ (chỉ chấp nhận READ hoặc EDIT): " + request.getPermission());
        }

        // Upsert permission
        Optional<DocumentPermission> existingOpt = documentPermissionRepository.findByDocumentIdAndUserId(documentId, targetUser.getId());
        DocumentPermission saved;
        if (existingOpt.isPresent()) {
            DocumentPermission existing = existingOpt.get();
            existing.setPermission(permissionType);
            saved = documentPermissionRepository.save(existing);
            auditService.log(username, "DOCUMENT_PERMISSION_UPDATE", "DOCUMENT", documentId.toString(),
                    username + " cập nhật quyền " + permissionType.name() + " tài liệu #" + documentId + " cho người dùng " + targetUser.getUsername(), null);

            String eventKey = "DOCUMENT_PERMISSION_UPDATED:" + documentId + ":" + targetUser.getUsername() + ":" + permissionType.name();
            notificationService.publishNotification(
                    targetUser.getUsername(),
                    NotificationType.DOCUMENT_PERMISSION_UPDATED,
                    "Cập nhật quyền truy cập",
                    "Quyền truy cập tài liệu '" + document.getTitle() + "' của bạn đã được cập nhật thành " + permissionType.name() + ".",
                    document.getId(),
                    document.getCurrentVersionNumber(),
                    "DOCUMENT",
                    document.getId(),
                    "OPEN_DOCUMENT",
                    eventKey
            );
        } else {
            DocumentPermission newPerm = new DocumentPermission(document, targetUser, permissionType);
            saved = documentPermissionRepository.save(newPerm);
            auditService.log(username, "DOCUMENT_SHARE", "DOCUMENT", documentId.toString(),
                    username + " chia sẻ quyền " + permissionType.name() + " tài liệu #" + documentId + " cho người dùng " + targetUser.getUsername(), null);

            String eventKey = "DOCUMENT_SHARED:" + documentId + ":" + targetUser.getUsername();
            notificationService.publishNotification(
                    targetUser.getUsername(),
                    NotificationType.DOCUMENT_SHARED,
                    "Tài liệu được chia sẻ",
                    "Tài liệu '" + document.getTitle() + "' đã được chia sẻ với bạn.",
                    document.getId(),
                    document.getCurrentVersionNumber(),
                    "DOCUMENT",
                    document.getId(),
                    "OPEN_DOCUMENT",
                    eventKey
            );
        }

        // Test 362 hook: Force share transaction to fail AFTER notification-triggering logic but BEFORE commit
        if (simRollback) {
            throw new RuntimeException("Simulated transaction rollback for Test 362");
        }

        return DocumentPermissionItemResponse.fromEntity(saved);
    }

    @Transactional
    public void revokePermission(Long documentId, Long targetUserId, String username, boolean isAdmin) {
        Document document = getDocumentById(documentId);

        if (document.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể thay đổi phân quyền");
        }
        if (document.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể thay đổi phân quyền");
        }

        documentAccessService.requireShare(document, username, isAdmin);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + targetUserId));

        documentPermissionRepository.deleteByDocumentIdAndUserId(documentId, targetUserId);
        auditService.log(username, "DOCUMENT_UNSHARE", "DOCUMENT", documentId.toString(),
                username + " thu hồi quyền truy cập tài liệu #" + documentId + " của người dùng " + targetUser.getUsername(), null);

        String eventKey = "DOCUMENT_ACCESS_REVOKED:" + documentId + ":" + targetUser.getUsername();
        notificationService.publishNotification(
                targetUser.getUsername(),
                NotificationType.DOCUMENT_ACCESS_REVOKED,
                "Thu hồi quyền truy cập",
                "Quyền truy cập tài liệu '" + document.getTitle() + "' của bạn đã bị thu hồi.",
                document.getId(),
                document.getCurrentVersionNumber(),
                "DOCUMENT",
                document.getId(),
                "OPEN_DOCUMENT",
                eventKey
        );
    }

    public DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file, String changeNote, String username, boolean isAdmin) {
        return uploadNewVersion(documentId, file, changeNote, username, isAdmin, false, false);
    }

    public DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file, String changeNote, String username, boolean isAdmin, boolean forceExtractionFailure) {
        return uploadNewVersion(documentId, file, changeNote, username, isAdmin, forceExtractionFailure, false);
    }

    public DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file, String changeNote, String username, boolean isAdmin, boolean forceExtractionFailure, boolean syncOcr) {
        return uploadNewVersion(documentId, file, changeNote, username, isAdmin, forceExtractionFailure, syncOcr, false);
    }

    public DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file, String changeNote, String username, boolean isAdmin, boolean forceExtractionFailure, boolean syncOcr, boolean forceOcrTimeout) {
        DocumentVersion newVersion = documentCoreService.uploadNewVersionCore(documentId, file, changeNote, username, isAdmin);
        // Core transaction committed to PostgreSQL!

        try {
            contentExtractionService.extractAndSaveById(newVersion.getId(), forceExtractionFailure);
        } catch (Exception e) {
            // Best effort extraction: core version persistence is durable
        }
        try {
            ocrService.evaluateAndQueueOcr(newVersion.getId(), syncOcr, forceOcrTimeout);
        } catch (Exception e) {
            // Best effort OCR
        }
        try {
            // Phase 12: Best-effort semantic indexing for new version
            semanticIndexingService.queueIndexing(newVersion.getId());
        } catch (Exception e) {
            // Best-effort semantic indexing; does NOT rollback version
        }

        DocumentVersion reloaded = documentVersionRepository.findById(newVersion.getId()).orElse(newVersion);
        return DocumentVersionResponse.fromEntity(reloaded, true);
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getDocumentVersions(Long documentId, String username, boolean isAdmin) {
        Document doc = getDocumentById(documentId);
        documentAccessService.requireRead(doc, username, isAdmin);

        List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
        return versions.stream()
                .map(v -> DocumentVersionResponse.fromEntity(v, v.getVersionNumber().equals(doc.getCurrentVersionNumber())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VersionResourceWrapper loadVersionFileAsResource(Long documentId, Integer versionNumber, String username, boolean isAdmin) {
        Document doc = getDocumentById(documentId);
        documentAccessService.requireRead(doc, username, isAdmin);

        DocumentVersion version = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản " + versionNumber + " không tồn tại đối với tài liệu #" + documentId));

        Resource resource = fileStorageService.loadFileAsResource(version.getStoredFileName());
        return new VersionResourceWrapper(resource, version);
    }

    public DocumentVersionResponse restoreVersion(Long documentId, Integer versionNumber, String username, boolean isAdmin) {
        return restoreVersion(documentId, versionNumber, username, isAdmin, false, false);
    }

    public DocumentVersionResponse restoreVersion(Long documentId, Integer versionNumber, String username, boolean isAdmin, boolean forceExtractionFailure) {
        return restoreVersion(documentId, versionNumber, username, isAdmin, forceExtractionFailure, false);
    }

    public DocumentVersionResponse restoreVersion(Long documentId, Integer versionNumber, String username, boolean isAdmin, boolean forceExtractionFailure, boolean syncOcr) {
        return restoreVersion(documentId, versionNumber, username, isAdmin, forceExtractionFailure, syncOcr, false);
    }

    public DocumentVersionResponse restoreVersion(Long documentId, Integer versionNumber, String username, boolean isAdmin, boolean forceExtractionFailure, boolean syncOcr, boolean forceOcrTimeout) {
        DocumentVersion restoredVersion = documentCoreService.restoreVersionCore(documentId, versionNumber, username, isAdmin);
        // Core transaction committed to PostgreSQL!

        try {
            DocumentVersion oldVersion = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber).orElse(null);
            if (forceExtractionFailure) {
                contentExtractionService.extractAndSaveById(restoredVersion.getId(), true);
            } else {
                if (oldVersion != null && oldVersion.getExtractionStatus() == ExtractionStatus.READY) {
                    restoredVersion.setExtractionStatus(ExtractionStatus.READY);
                    restoredVersion.setExtractedText(oldVersion.getExtractedText());
                    restoredVersion.setExtractedCharacterCount(oldVersion.getExtractedCharacterCount());
                    restoredVersion.setExtractedAt(Instant.now());
                    restoredVersion.setExtractionError(null);
                    documentVersionRepository.save(restoredVersion);
                } else if (oldVersion != null && oldVersion.getExtractionStatus() == ExtractionStatus.UNSUPPORTED) {
                    restoredVersion.setExtractionStatus(ExtractionStatus.UNSUPPORTED);
                    restoredVersion.setExtractedText(null);
                    restoredVersion.setExtractedCharacterCount(null);
                    restoredVersion.setExtractedAt(Instant.now());
                    documentVersionRepository.save(restoredVersion);
                } else {
                    contentExtractionService.extractAndSaveById(restoredVersion.getId(), false);
                }
            }

            // Copy OCR if already available on source version, or queue
            if (oldVersion != null && oldVersion.getOcrStatus() == OcrStatus.READY) {
                restoredVersion.setOcrStatus(OcrStatus.READY);
                restoredVersion.setOcrText(oldVersion.getOcrText());
                restoredVersion.setOcrCharacterCount(oldVersion.getOcrCharacterCount());
                restoredVersion.setOcrLanguage(oldVersion.getOcrLanguage());
                restoredVersion.setOcrAt(Instant.now());
                restoredVersion.setOcrError(null);
                documentVersionRepository.save(restoredVersion);
            } else if (oldVersion != null && oldVersion.getOcrStatus() == OcrStatus.NOT_REQUIRED) {
                restoredVersion.setOcrStatus(OcrStatus.NOT_REQUIRED);
                documentVersionRepository.save(restoredVersion);
            } else {
                ocrService.evaluateAndQueueOcr(restoredVersion.getId(), syncOcr, forceOcrTimeout);
            }
        } catch (Exception e) {
            // Best effort extraction: core restore persistence is durable
        }

        try {
            // Phase 12: Best-effort semantic indexing for restored version (new independent index)
            semanticIndexingService.queueIndexing(restoredVersion.getId());
        } catch (Exception e) {
            // Best-effort semantic indexing; does NOT rollback restore
        }

        DocumentVersion reloaded = documentVersionRepository.findById(restoredVersion.getId()).orElse(restoredVersion);
        return DocumentVersionResponse.fromEntity(reloaded, true);
    }

    @Transactional
    public DocumentResponse archiveDocument(Long id, ArchiveRequest request, String username, boolean isAdmin) {
        Document doc = documentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + id));

        documentAccessService.requireArchive(doc, username, isAdmin);

        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể lưu trữ");
        }

        if (doc.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu #" + id + " đã ở trạng thái lưu trữ (ARCHIVED)");
        }

        String currentReviewStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        if (!"APPROVED".equalsIgnoreCase(currentReviewStatus)) {
            throw new WorkflowConflictException("Chỉ tài liệu có phiên bản hiện hành đã được phê duyệt (APPROVED) mới được phép lưu trữ (ARCHIVE). Trạng thái hiện tại: " + currentReviewStatus);
        }

        if (request != null && request.getRetentionUntil() != null) {
            if (request.getRetentionUntil().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Ngày lưu trữ tối thiểu (retentionUntil) không thể nằm trong quá khứ");
            }
            doc.setRetentionUntil(request.getRetentionUntil());
        }

        doc.setLifecycleStatus(LifecycleStatus.ARCHIVED);
        doc.setArchivedAt(Instant.now());
        doc.setArchivedBy(username);
        doc.setUpdatedAt(Instant.now());

        Document savedDoc = documentRepository.save(doc);
        auditService.log(username, "DOCUMENT_ARCHIVE", "DOCUMENT", savedDoc.getId().toString(),
                username + " lưu trữ tài liệu #" + savedDoc.getId() + " (" + savedDoc.getTitle() + ")", null);

        String perm = documentAccessService.getUserPermissionLevel(savedDoc, username, isAdmin);
        return toDocumentResponse(savedDoc, perm);
    }

    @Transactional
    public DocumentResponse unarchiveDocument(Long id, String username, boolean isAdmin) {
        Document doc = documentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + id));

        documentAccessService.requireUnarchive(doc, username, isAdmin);

        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể khôi phục hoạt động");
        }

        if (doc.getLifecycleStatus() != LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu #" + id + " hiện không ở trạng thái lưu trữ (ARCHIVED)");
        }

        doc.setLifecycleStatus(LifecycleStatus.ACTIVE);
        doc.setArchivedAt(null);
        doc.setArchivedBy(null);
        doc.setUpdatedAt(Instant.now());

        Document savedDoc = documentRepository.save(doc);

        // Auto-cancel any pending disposition requests on unarchive (Requirement 33)
        documentDispositionService.cancelPendingDispositionsOnUnarchive(savedDoc, username);

        auditService.log(username, "DOCUMENT_UNARCHIVE", "DOCUMENT", savedDoc.getId().toString(),
                username + " khôi phục hoạt động tài liệu #" + savedDoc.getId() + " (" + savedDoc.getTitle() + ")", null);

        String perm = documentAccessService.getUserPermissionLevel(savedDoc, username, isAdmin);
        return toDocumentResponse(savedDoc, perm);
    }

    @Transactional
    public DocumentResponse updateRetention(Long id, RetentionUpdateRequest request, String username, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền cập nhật thời hạn lưu trữ (retention)");
        }

        Document doc = documentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + id));

        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể thay đổi thời hạn lưu trữ");
        }

        LocalDate retentionDate = null;
        if (request != null && request.getRetentionUntil() != null && !request.getRetentionUntil().isBlank()) {
            try {
                retentionDate = LocalDate.parse(request.getRetentionUntil().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Định dạng ngày lưu trữ không hợp lệ: " + request.getRetentionUntil() + ". Vui lòng sử dụng định dạng YYYY-MM-DD");
            }
        }

        doc.setRetentionUntil(retentionDate);
        doc.setUpdatedAt(Instant.now());

        Document savedDoc = documentRepository.save(doc);
        auditService.log(username, "DOCUMENT_RETENTION_UPDATE", "DOCUMENT", savedDoc.getId().toString(),
                username + " cập nhật thời hạn lưu trữ tài liệu #" + savedDoc.getId() + " thành " + (retentionDate != null ? retentionDate.toString() : "null"), null);

        return toDocumentResponse(savedDoc, "ADMIN");
    }

    @Transactional
    public DocumentResponse updateLegalHold(Long id, LegalHoldRequest request, String username, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền thiết lập Legal Hold");
        }

        if (request == null || request.getEnabled() == null) {
            throw new IllegalArgumentException("Trường enabled là bắt buộc");
        }

        Document doc = documentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + id));

        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể thiết lập hoặc thay đổi Legal Hold");
        }

        if (Boolean.TRUE.equals(request.getEnabled())) {
            if (request.getReason() == null || request.getReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Lý do thiết lập Legal Hold là bắt buộc");
            }
            doc.setLegalHold(true);
            doc.setLegalHoldReason(request.getReason().trim());
            doc.setLegalHoldSetAt(Instant.now());
            doc.setLegalHoldSetBy(username);
            doc.setUpdatedAt(Instant.now());

            auditService.log(username, "DOCUMENT_LEGAL_HOLD_SET", "DOCUMENT", doc.getId().toString(),
                    username + " thiết lập Legal Hold cho tài liệu #" + doc.getId() + ": " + doc.getLegalHoldReason(), null);
        } else {
            doc.setLegalHold(false);
            doc.setLegalHoldReason(null);
            doc.setLegalHoldSetAt(null);
            doc.setLegalHoldSetBy(null);
            doc.setUpdatedAt(Instant.now());

            auditService.log(username, "DOCUMENT_LEGAL_HOLD_RELEASE", "DOCUMENT", doc.getId().toString(),
                    username + " giải phóng Legal Hold cho tài liệu #" + doc.getId(), null);
        }

        Document savedDoc = documentRepository.save(doc);
        return toDocumentResponse(savedDoc, "ADMIN");
    }
}

