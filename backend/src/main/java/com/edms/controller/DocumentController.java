package com.edms.controller;

import com.edms.dto.*;
import com.edms.entity.Document;
import com.edms.service.AuditService;
import com.edms.service.DocumentService;
import com.edms.service.HybridSearchService;
import com.edms.service.SemanticSearchService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final AuditService auditService;
    private final SemanticSearchService semanticSearchService;
    private final HybridSearchService hybridSearchService;

    public DocumentController(DocumentService documentService, AuditService auditService,
                               SemanticSearchService semanticSearchService,
                               HybridSearchService hybridSearchService) {
        this.documentService = documentService;
        this.auditService = auditService;
        this.semanticSearchService = semanticSearchService;
        this.hybridSearchService = hybridSearchService;
    }

    private boolean checkIsAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private String getUsername(Principal principal) {
        return principal != null ? principal.getName() : "anonymous";
    }

    private ContentDisposition createSafeContentDisposition(String type, String originalFileName, String contentType) {
        String filename = originalFileName != null ? originalFileName.replaceAll("[\\r\\n\"\\\\]", "_") : "document";
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean isActiveWeb = lower.endsWith(".html") || lower.endsWith(".htm") || lower.endsWith(".svg")
                || (contentType != null && (contentType.contains("text/html") || contentType.contains("image/svg+xml") || contentType.contains("application/xhtml+xml")));

        String dispositionType = ("inline".equalsIgnoreCase(type) && !isActiveWeb) ? "inline" : "attachment";
        return ContentDisposition.builder(dispositionType)
                .filename(filename)
                .build();
    }

    private void validateSearchScope(String searchScope) {
        if (searchScope != null && !searchScope.isBlank()) {
            String upper = searchScope.trim().toUpperCase();
            if (!"METADATA".equals(upper) && !"CONTENT".equals(upper) && !"ALL".equals(upper)) {
                throw new IllegalArgumentException("Phạm vi tìm kiếm không hợp lệ: " + searchScope + ". Hợp lệ: METADATA, CONTENT, ALL");
            }
        }
    }

    /**
     * Phase 12: Validate searchMode. Blank/null → LEXICAL (backward compatible). Invalid → 400.
     * Allowed: LEXICAL, SEMANTIC, HYBRID
     */
    private String validateAndNormalizeSearchMode(String searchMode) {
        if (searchMode == null || searchMode.isBlank()) return "LEXICAL";
        String upper = searchMode.trim().toUpperCase();
        if (!"LEXICAL".equals(upper) && !"SEMANTIC".equals(upper) && !"HYBRID".equals(upper)) {
            throw new IllegalArgumentException("Chế độ tìm kiếm không hợp lệ: " + searchMode + ". Hợp lệ: LEXICAL, SEMANTIC, HYBRID");
        }
        return upper;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "accessMode", required = false, defaultValue = "INTERNAL") String accessMode,
            @RequestHeader(value = "X-Force-Extraction-Failure", required = false, defaultValue = "false") boolean forceExtractionFailure,
            @RequestHeader(value = "X-Sync-Ocr", required = false, defaultValue = "false") boolean syncOcr,
            @RequestHeader(value = "X-Force-Ocr-Timeout", required = false, defaultValue = "false") boolean forceOcrTimeout,
            Principal principal) {

        String username = getUsername(principal);
        DocumentMetadataRequest metadata = new DocumentMetadataRequest(title, description, documentType, accessMode);

        DocumentResponse response = documentService.uploadDocument(file, metadata, username, forceExtractionFailure, syncOcr, forceOcrTimeout);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAllDocuments(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "lifecycleStatus", required = false) String lifecycleStatus,
            @RequestParam(value = "searchScope", required = false, defaultValue = "METADATA") String searchScope,
            @RequestParam(value = "searchMode", required = false) String searchMode,
            @RequestParam(value = "topK", required = false) Integer topK,
            @RequestParam(value = "includeArchived", required = false) Boolean includeArchived,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);
        validateSearchScope(searchScope);
        String effectiveMode = validateAndNormalizeSearchMode(searchMode);

        String effectiveLifecycle = lifecycleStatus;
        if ((effectiveLifecycle == null || effectiveLifecycle.isBlank()) && Boolean.FALSE.equals(includeArchived)) {
            effectiveLifecycle = "ACTIVE";
        }

        List<DocumentResponse> documents;

        if ("SEMANTIC".equals(effectiveMode)) {
            // Validate query for semantic
            semanticSearchService.validateQuery(query);
            int k = semanticSearchService.validateTopK(topK);
            List<SemanticSearchService.SemanticSearchResult> semResults =
                    semanticSearchService.search(query, username, isAdmin, k);
            // Fetch full DocumentResponse for each result
            documents = semResults.stream()
                    .map(sr -> {
                        try {
                            DocumentResponse dr = documentService.getDocumentResponseById(sr.documentId, username, isAdmin);
                            dr.setSemanticMatched(true);
                            dr.setSemanticScore(sr.semanticScore);
                            dr.setSearchMode("SEMANTIC");
                            if (sr.matchSnippet != null) dr.setMatchSnippet(sr.matchSnippet);
                            return dr;
                        } catch (Exception e) { return null; }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
        } else if ("HYBRID".equals(effectiveMode)) {
            String safeQuery = (query != null) ? query : "";
            int k = semanticSearchService.validateTopK(topK);
            List<HybridSearchService.HybridResult> hybridResults =
                    hybridSearchService.search(safeQuery, username, isAdmin, searchScope, documentType, k);
            documents = hybridResults.stream()
                    .map(hr -> {
                        hr.document.setSearchMode("HYBRID");
                        return hr.document;
                    })
                    .collect(java.util.stream.Collectors.toList());
        } else {
            // LEXICAL (default) — backward compatible behavior
            documents = documentService.searchDocuments(username, isAdmin, query, documentType, effectiveLifecycle, searchScope);
            documents.forEach(d -> d.setSearchMode("LEXICAL"));
        }

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "lifecycleStatus", required = false) String lifecycleStatus,
            @RequestParam(value = "searchScope", required = false, defaultValue = "METADATA") String searchScope,
            Principal principal) {
        String username = getUsername(principal);
        validateSearchScope(searchScope);
        List<DocumentResponse> documents = documentService.searchMyDocuments(username, query, documentType, lifecycleStatus, searchScope);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<DocumentResponse>> getSharedWithMeDocuments(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "lifecycleStatus", required = false) String lifecycleStatus,
            @RequestParam(value = "searchScope", required = false, defaultValue = "METADATA") String searchScope,
            Principal principal) {
        String username = getUsername(principal);
        validateSearchScope(searchScope);
        List<DocumentResponse> documents = documentService.getSharedWithMeDocuments(username, query, documentType, lifecycleStatus, searchScope);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.getDocumentResponseById(id, username, isAdmin);
        auditService.log(username, "DOCUMENT_VIEW", "DOCUMENT", id.toString(), "Xem chi tiết tài liệu: " + response.getTitle(), null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        Document doc = documentService.getDocumentById(id);
        Resource resource = documentService.loadFileAsResource(id, username, isAdmin);

        auditService.log(username, "DOCUMENT_DOWNLOAD", "DOCUMENT", id.toString(), "Tải xuống tệp: " + doc.getOriginalFileName(), null);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (doc.getContentType() != null && !doc.getContentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(doc.getContentType());
            } catch (Exception ignored) {
            }
        }

        ContentDisposition cd = createSafeContentDisposition("attachment", doc.getOriginalFileName(), doc.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewDocument(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        Document doc = documentService.getDocumentById(id);
        Resource resource = documentService.loadFileAsResource(id, username, isAdmin);

        auditService.log(username, "DOCUMENT_PREVIEW", "DOCUMENT", id.toString(), "Xem trước tệp: " + doc.getOriginalFileName(), null);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (doc.getContentType() != null && !doc.getContentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(doc.getContentType());
            } catch (Exception ignored) {
            }
        }

        ContentDisposition cd = createSafeContentDisposition("inline", doc.getOriginalFileName(), doc.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(resource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable("id") Long id,
            @Valid @RequestBody DocumentUpdateRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.updateDocument(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/access-mode")
    public ResponseEntity<DocumentResponse> updateAccessMode(
            @PathVariable("id") Long id,
            @Valid @RequestBody AccessModeUpdateRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.updateAccessMode(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<DocumentPermissionsResponse> getPermissions(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentPermissionsResponse response = documentService.getPermissions(id, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/permissions")
    public ResponseEntity<DocumentPermissionItemResponse> grantOrUpdatePermission(
            @PathVariable("id") Long id,
            @Valid @RequestBody ShareDocumentRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentPermissionItemResponse response = documentService.grantOrUpdatePermission(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/permissions/{userId}")
    public ResponseEntity<DocumentPermissionItemResponse> putPermission(
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody ShareDocumentRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        request.setUserId(userId);
        DocumentPermissionItemResponse response = documentService.grantOrUpdatePermission(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/permissions/{userId}")
    public ResponseEntity<Map<String, String>> revokePermission(
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        documentService.revokePermission(id, userId, username, isAdmin);
        return ResponseEntity.ok(Map.of("message", "Thu hồi quyền truy cập thành công."));
    }

    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentVersionResponse> uploadNewVersion(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "changeNote", required = false) String changeNote,
            @RequestHeader(value = "X-Force-Extraction-Failure", required = false, defaultValue = "false") boolean forceExtractionFailure,
            @RequestHeader(value = "X-Sync-Ocr", required = false, defaultValue = "false") boolean syncOcr,
            @RequestHeader(value = "X-Force-Ocr-Timeout", required = false, defaultValue = "false") boolean forceOcrTimeout,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentVersionResponse response = documentService.uploadNewVersion(id, file, changeNote, username, isAdmin, forceExtractionFailure, syncOcr, forceOcrTimeout);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<DocumentVersionResponse>> getDocumentVersions(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        List<DocumentVersionResponse> versions = documentService.getDocumentVersions(id, username, isAdmin);
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/{id}/versions/{versionNumber}/preview")
    public ResponseEntity<Resource> previewDocumentVersion(
            @PathVariable("id") Long id,
            @PathVariable("versionNumber") Integer versionNumber,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        VersionResourceWrapper wrapper = documentService.loadVersionFileAsResource(id, versionNumber, username, isAdmin);
        auditService.log(username, "DOCUMENT_VERSION_PREVIEW", "DOCUMENT", id.toString(),
                username + " xem trước phiên bản " + versionNumber + " của tài liệu #" + id, null);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (wrapper.getVersion().getContentType() != null && !wrapper.getVersion().getContentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(wrapper.getVersion().getContentType());
            } catch (Exception ignored) {
            }
        }

        ContentDisposition cd = createSafeContentDisposition("inline", wrapper.getVersion().getOriginalFileName(), wrapper.getVersion().getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(wrapper.getResource());
    }

    @GetMapping("/{id}/versions/{versionNumber}/download")
    public ResponseEntity<Resource> downloadDocumentVersion(
            @PathVariable("id") Long id,
            @PathVariable("versionNumber") Integer versionNumber,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        VersionResourceWrapper wrapper = documentService.loadVersionFileAsResource(id, versionNumber, username, isAdmin);
        auditService.log(username, "DOCUMENT_VERSION_DOWNLOAD", "DOCUMENT", id.toString(),
                username + " tải xuống phiên bản " + versionNumber + " của tài liệu #" + id, null);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (wrapper.getVersion().getContentType() != null && !wrapper.getVersion().getContentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(wrapper.getVersion().getContentType());
            } catch (Exception ignored) {
            }
        }

        ContentDisposition cd = createSafeContentDisposition("attachment", wrapper.getVersion().getOriginalFileName(), wrapper.getVersion().getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .body(wrapper.getResource());
    }

    @PostMapping("/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<DocumentVersionResponse> restoreVersion(
            @PathVariable("id") Long id,
            @PathVariable("versionNumber") Integer versionNumber,
            @RequestHeader(value = "X-Force-Extraction-Failure", required = false, defaultValue = "false") boolean forceExtractionFailure,
            @RequestHeader(value = "X-Sync-Ocr", required = false, defaultValue = "false") boolean syncOcr,
            @RequestHeader(value = "X-Force-Ocr-Timeout", required = false, defaultValue = "false") boolean forceOcrTimeout,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentVersionResponse response = documentService.restoreVersion(id, versionNumber, username, isAdmin, forceExtractionFailure, syncOcr, forceOcrTimeout);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<DocumentResponse> archiveDocument(
            @PathVariable("id") Long id,
            @RequestBody(required = false) ArchiveRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.archiveDocument(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/unarchive")
    public ResponseEntity<DocumentResponse> unarchiveDocument(
            @PathVariable("id") Long id,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.unarchiveDocument(id, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/retention")
    public ResponseEntity<DocumentResponse> updateRetention(
            @PathVariable("id") Long id,
            @RequestBody RetentionUpdateRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.updateRetention(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/legal-hold")
    public ResponseEntity<DocumentResponse> updateLegalHold(
            @PathVariable("id") Long id,
            @RequestBody LegalHoldRequest request,
            Principal principal,
            Authentication authentication) {
        String username = getUsername(principal);
        boolean isAdmin = checkIsAdmin(authentication);

        DocumentResponse response = documentService.updateLegalHold(id, request, username, isAdmin);
        return ResponseEntity.ok(response);
    }
}
