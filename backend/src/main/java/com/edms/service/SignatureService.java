package com.edms.service;

import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.exception.ResourceNotFoundException;
import com.edms.entity.LifecycleStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Signature;
import java.time.Instant;

/**
 * Phase 13: RSA-2048 digital signature for DocumentVersion.
 *
 * Signing flow:
 *  1. Verify caller has WRITE permission (owner) or is ADMIN.
 *  2. Reject if already signed (409 Conflict).
 *  3. Reject if document is DISPOSED (422 Unprocessable).
 *  4. Load file bytes from physical storage.
 *  5. Re-verify SHA-256 hash matches stored fileHash (ensures integrity before signing).
 *  6. Sign with SHA256withRSA using the server's private key.
 *  7. Persist signatureBytes, signatureAlgorithm, signerUsername, signedAt, certSerialNumber.
 *  8. Write AuditLog: DOCUMENT_SIGNED.
 *
 * SECURITY: The private key is held exclusively in KeyStoreService and never exposed.
 */
@Service
public class SignatureService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentAccessService documentAccessService;
    private final KeyStoreService keyStoreService;
    private final IntegrityService integrityService;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public SignatureService(DocumentRepository documentRepository,
                            DocumentVersionRepository documentVersionRepository,
                            DocumentAccessService documentAccessService,
                            KeyStoreService keyStoreService,
                            IntegrityService integrityService,
                            FileStorageService fileStorageService,
                            AuditService auditService,
                            NotificationService notificationService) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentAccessService = documentAccessService;
        this.keyStoreService = keyStoreService;
        this.integrityService = integrityService;
        this.fileStorageService = fileStorageService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    // -------------------------------------------------------------------------
    // Public result record
    // -------------------------------------------------------------------------

    public record SignatureResult(
            Long documentId,
            Integer versionNumber,
            String signatureAlgorithm,
            String signerUsername,
            Instant signedAt,
            String certSerialNumber,
            String certSubject,
            Instant certValidFrom,
            Instant certValidUntil,
            String message
    ) {}

    // -------------------------------------------------------------------------
    // Core signing operation
    // -------------------------------------------------------------------------

    @Transactional
    public SignatureResult signVersion(Long docId, int versionNumber,
                                       String callerUsername, boolean isAdmin) {
        // 1. Load document
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại: " + docId));

        // 2. Reject DISPOSED and ARCHIVED
        if (LifecycleStatus.DISPOSED.equals(doc.getLifecycleStatus())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Không thể ký tài liệu đã bị xử lý (DISPOSED).");
        }
        if (LifecycleStatus.ARCHIVED.equals(doc.getLifecycleStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tài liệu đã ở trạng thái lưu trữ (ARCHIVED), không thể thực hiện ký mới.");
        }

        // 3. ACL check: only owner or ADMIN can sign
        boolean isOwner = callerUsername != null && callerUsername.equalsIgnoreCase(doc.getCreatedBy());
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Bạn không có quyền ký tài liệu này. Chỉ chủ sở hữu hoặc Quản trị viên mới có thể ký.");
        }

        // 4. Load the specific version
        DocumentVersion version = documentVersionRepository
                .findByDocumentIdAndVersionNumber(docId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên bản " + versionNumber + " của tài liệu " + docId + " không tồn tại."));

        // 5. Reject if already signed
        if (version.getSignatureBytes() != null && version.getSignatureBytes().length > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Phiên bản này đã được ký. Không thể ký lại. (certSerial=" + version.getCertSerialNumber() + ")");
        }

        // 6. Load physical file
        byte[] fileBytes;
        try {
            Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
            fileBytes = Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("[Phase 13] Không thể đọc tệp vật lý để ký: " + version.getStoredFileName(), e);
        }

        // 7. Re-verify hash integrity before signing (defense-in-depth)
        if (version.getFileHash() != null) {
            String currentHash = integrityService.computeSha256(fileBytes);
            if (!currentHash.equals(version.getFileHash())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Tệp vật lý đã bị thay đổi (TAMPERED). Không thể ký tài liệu bị xâm phạm.");
            }
        } else {
            // Pre-Phase 13 document without hash — stamp it now
            integrityService.stampHash(version, fileBytes);
        }

        // 8. Sign with SHA256withRSA
        byte[] signatureBytes;
        try {
            Signature signer = Signature.getInstance("SHA256withRSA");
            signer.initSign(keyStoreService.getSigningKey());
            signer.update(fileBytes);
            signatureBytes = signer.sign();
        } catch (Exception e) {
            throw new RuntimeException("[Phase 13] RSA signing failed", e);
        }

        // 9. Persist signature metadata
        var cert = keyStoreService.getSigningCertificate();
        Instant signedAt = Instant.now();
        version.setSignatureBytes(signatureBytes);
        version.setSignatureAlgorithm("SHA256withRSA");
        version.setSignerUsername(callerUsername);
        version.setSignedAt(signedAt);
        version.setCertSerialNumber(cert.getSerialNumber().toString());
        documentVersionRepository.save(version);

        // 10. Audit log
        auditService.log(
                callerUsername,
                "DOCUMENT_SIGNED",
                "DOCUMENT_VERSION",
                docId + "/v" + versionNumber,
                "algorithm=SHA256withRSA certSerial=" + cert.getSerialNumber(),
                null);

        // Section 11 Notification Policy: If signer != owner, notify owner. If signer == owner, skip self-notification.
        String eventKey = "DOCUMENT_SIGNED:" + docId + ":" + versionNumber;
        if (doc.getCreatedBy() != null && !callerUsername.equalsIgnoreCase(doc.getCreatedBy())) {
            notificationService.publishNotification(
                    doc.getCreatedBy(),
                    com.edms.entity.NotificationType.DOCUMENT_SIGNED,
                    "Tài liệu đã được ký điện tử",
                    "Tài liệu '" + doc.getTitle() + "' (phiên bản " + versionNumber + ") đã được ký điện tử bởi " + callerUsername + ".",
                    docId,
                    versionNumber,
                    "DOCUMENT_VERSION",
                    (long) versionNumber,
                    "OPEN_INTEGRITY",
                    eventKey
            );
        }

        // Test 364 hook: Force signature operation failure after event preparation but before commit
        if (doc.getTitle() != null && doc.getTitle().contains("SIMULATE_SIGN_ROLLBACK")) {
            throw new RuntimeException("Simulated transaction rollback for Test 364");
        }

        return new SignatureResult(
                docId,
                versionNumber,
                "SHA256withRSA",
                callerUsername,
                signedAt,
                cert.getSerialNumber().toString(),
                cert.getSubjectX500Principal().getName(),
                cert.getNotBefore().toInstant(),
                cert.getNotAfter().toInstant(),
                "Tài liệu đã được ký điện tử thành công.");
    }
}
