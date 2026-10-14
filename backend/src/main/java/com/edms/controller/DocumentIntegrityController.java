package com.edms.controller;

import com.edms.dto.IntegrityVerificationResponse;
import com.edms.dto.SignDocumentResponse;
import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.exception.ResourceNotFoundException;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import com.edms.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Phase 13 & Phase 14: Document Digital Signature, Integrity Verification & Dynamic Watermarking Controller.
 *
 * Endpoints:
 *   POST /api/documents/{id}/versions/{vn}/sign                 — Sign a document version (owner or ADMIN)
 *   GET  /api/documents/{id}/versions/{vn}/integrity            — Verify integrity + signature (authorized user)
 *   GET  /api/admin/signature/certificate                       — Retrieve public X.509 cert info (ADMIN only)
 *   GET  /api/documents/{id}/versions/{vn}/download-watermarked — Download PDF/image with dynamic watermark & QR
 *   GET  /api/documents/{id}/versions/{vn}/preview-watermarked  — Preview PDF/image with dynamic watermark & QR
 *   GET  /api/documents/{id}/download-watermarked               — Convenience download latest version with watermark
 *   GET  /api/documents/{id}/preview-watermarked                — Convenience preview latest version with watermark
 */
@RestController
public class DocumentIntegrityController {

    private static final Logger log = LoggerFactory.getLogger(DocumentIntegrityController.class);

    private final SignatureService signatureService;
    private final IntegrityService integrityService;
    private final KeyStoreService keyStoreService;
    private final WatermarkService watermarkService;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final FileStorageService fileStorageService;
    private final DocumentAccessService documentAccessService;
    private final AuditService auditService;

    public DocumentIntegrityController(SignatureService signatureService,
                                       IntegrityService integrityService,
                                       KeyStoreService keyStoreService,
                                       WatermarkService watermarkService,
                                       DocumentRepository documentRepository,
                                       DocumentVersionRepository documentVersionRepository,
                                       FileStorageService fileStorageService,
                                       DocumentAccessService documentAccessService,
                                       AuditService auditService) {
        this.signatureService = signatureService;
        this.integrityService = integrityService;
        this.keyStoreService = keyStoreService;
        this.watermarkService = watermarkService;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.fileStorageService = fileStorageService;
        this.documentAccessService = documentAccessService;
        this.auditService = auditService;
    }

    // -------------------------------------------------------------------------
    // POST /api/documents/{id}/versions/{vn}/sign
    // -------------------------------------------------------------------------

    @PostMapping("/api/documents/{id}/versions/{vn}/sign")
    public ResponseEntity<SignDocumentResponse> signVersion(
            @PathVariable("id") Long docId,
            @PathVariable("vn") int versionNumber,
            Authentication authentication) {

        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        SignatureService.SignatureResult result = signatureService.signVersion(
                docId, versionNumber, username, isAdmin);

        return ResponseEntity.ok(SignDocumentResponse.from(result));
    }

    // -------------------------------------------------------------------------
    // GET /api/documents/{id}/versions/{vn}/integrity
    // -------------------------------------------------------------------------

    @GetMapping("/api/documents/{id}/versions/{vn}/integrity")
    public ResponseEntity<IntegrityVerificationResponse> verifyIntegrity(
            @PathVariable("id") Long docId,
            @PathVariable("vn") int versionNumber,
            Authentication authentication) {

        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        IntegrityService.IntegrityVerificationResult result =
                integrityService.verifyIntegrity(docId, versionNumber, username, isAdmin);

        return ResponseEntity.ok(IntegrityVerificationResponse.from(result));
    }

    // -------------------------------------------------------------------------
    // GET /api/admin/signature/certificate   (ROLE_ADMIN only via SecurityConfig)
    // -------------------------------------------------------------------------

    @GetMapping("/api/admin/signature/certificate")
    public ResponseEntity<Map<String, Object>> getSigningCertificate() {
        X509Certificate cert = keyStoreService.getSigningCertificate();

        if (cert == null) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Signing certificate not available"));
        }

        String pemCert;
        try {
            byte[] certBytes = cert.getEncoded();
            String base64 = java.util.Base64.getMimeEncoder(64, new byte[]{'\n'})
                    .encodeToString(certBytes);
            pemCert = "-----BEGIN CERTIFICATE-----\n" + base64 + "\n-----END CERTIFICATE-----";
        } catch (Exception e) {
            pemCert = "<encoding error>";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("algorithm", cert.getSigAlgName());
        response.put("serialNumber", cert.getSerialNumber().toString());
        response.put("subject", cert.getSubjectX500Principal().getName());
        response.put("issuer", cert.getIssuerX500Principal().getName());
        response.put("validFrom", cert.getNotBefore().toInstant());
        response.put("validUntil", cert.getNotAfter().toInstant());
        response.put("publicKeyAlgorithm", cert.getPublicKey().getAlgorithm());
        response.put("pemCertificate", pemCert);
        response.put("generatedAt", Instant.now());

        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------------------------
    // Phase 14: Dynamic Watermarking & QR Code Overlay Endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/api/documents/{id}/versions/{vn}/download-watermarked")
    public ResponseEntity<byte[]> downloadWatermarkedVersion(
            @PathVariable("id") Long docId,
            @PathVariable("vn") int versionNumber,
            @RequestParam(value = "watermarkText", required = false) String watermarkText,
            @RequestParam(value = "includeQr", defaultValue = "true") boolean includeQr,
            @RequestParam(value = "baseUrl", required = false) String baseUrl,
            Authentication authentication) {
        return processWatermark(docId, versionNumber, watermarkText, includeQr, baseUrl, authentication, false);
    }

    @GetMapping("/api/documents/{id}/versions/{vn}/preview-watermarked")
    public ResponseEntity<byte[]> previewWatermarkedVersion(
            @PathVariable("id") Long docId,
            @PathVariable("vn") int versionNumber,
            @RequestParam(value = "watermarkText", required = false) String watermarkText,
            @RequestParam(value = "includeQr", defaultValue = "true") boolean includeQr,
            @RequestParam(value = "baseUrl", required = false) String baseUrl,
            Authentication authentication) {
        return processWatermark(docId, versionNumber, watermarkText, includeQr, baseUrl, authentication, true);
    }

    @GetMapping("/api/documents/{id}/download-watermarked")
    public ResponseEntity<byte[]> downloadLatestWatermarked(
            @PathVariable("id") Long docId,
            @RequestParam(value = "watermarkText", required = false) String watermarkText,
            @RequestParam(value = "includeQr", defaultValue = "true") boolean includeQr,
            @RequestParam(value = "baseUrl", required = false) String baseUrl,
            Authentication authentication) {
        int latestVersion = documentVersionRepository.findMaxVersionNumberByDocumentId(docId);
        if (latestVersion <= 0) latestVersion = 1;
        return processWatermark(docId, latestVersion, watermarkText, includeQr, baseUrl, authentication, false);
    }

    @GetMapping("/api/documents/{id}/preview-watermarked")
    public ResponseEntity<byte[]> previewLatestWatermarked(
            @PathVariable("id") Long docId,
            @RequestParam(value = "watermarkText", required = false) String watermarkText,
            @RequestParam(value = "includeQr", defaultValue = "true") boolean includeQr,
            @RequestParam(value = "baseUrl", required = false) String baseUrl,
            Authentication authentication) {
        int latestVersion = documentVersionRepository.findMaxVersionNumberByDocumentId(docId);
        if (latestVersion <= 0) latestVersion = 1;
        return processWatermark(docId, latestVersion, watermarkText, includeQr, baseUrl, authentication, true);
    }

    private ResponseEntity<byte[]> processWatermark(Long docId,
                                                    int versionNumber,
                                                    String watermarkText,
                                                    boolean includeQr,
                                                    String baseUrl,
                                                    Authentication authentication,
                                                    boolean inline) {
        String username = authentication != null ? authentication.getName() : "ANONYMOUS";
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại: " + docId));
        documentAccessService.requireRead(doc, username, isAdmin);

        DocumentVersion version = documentVersionRepository
                .findByDocumentIdAndVersionNumber(docId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản " + versionNumber + " của tài liệu " + docId + " không tồn tại."));

        byte[] rawBytes;
        try {
            Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
            rawBytes = Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc tệp vật lý: " + version.getStoredFileName(), e);
        }

        byte[] outputBytes = rawBytes;
        String contentType = version.getContentType();
        String originalFileName = version.getOriginalFileName();

        try {
            if (watermarkService.isPdf(contentType, originalFileName)) {
                outputBytes = watermarkService.applyWatermarkAndQrToPdf(
                        rawBytes, doc, version, username, watermarkText, includeQr, baseUrl);
                contentType = "application/pdf";
            } else if (watermarkService.isImage(contentType, originalFileName)) {
                outputBytes = watermarkService.applyWatermarkAndQrToImage(
                        rawBytes, doc, version, username, watermarkText, includeQr, baseUrl);
                contentType = "image/png";
            }
        } catch (Exception e) {
            log.error("Lỗi khi áp dụng watermark cho tài liệu {}: {}", docId, e.getMessage(), e);
        }

        auditService.log(
                username,
                inline ? "DOCUMENT_PREVIEW_WATERMARKED" : "DOCUMENT_DOWNLOAD_WATERMARKED",
                "DOCUMENT_VERSION",
                docId + "/v" + versionNumber,
                "Watermarked file: " + originalFileName,
                null);

        String outFileName = "WATERMARKED_" + originalFileName;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));
        if (inline) {
            headers.setContentDisposition(ContentDisposition.inline().filename(outFileName, StandardCharsets.UTF_8).build());
        } else {
            headers.setContentDisposition(ContentDisposition.attachment().filename(outFileName, StandardCharsets.UTF_8).build());
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(outputBytes);
    }
}
