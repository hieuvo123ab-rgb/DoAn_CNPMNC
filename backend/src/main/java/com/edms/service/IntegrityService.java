package com.edms.service;

import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.exception.ResourceNotFoundException;
import com.edms.model.IntegrityStatus;
import com.edms.model.SignatureStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Phase 13: File integrity verification and SHA-256 hash computation.
 *
 * Responsibilities:
 *  - computeSha256(fileBytes)      : returns "sha256:<64-hex>" string
 *  - stampHash(version, bytes)     : populates fileHash / hashAlgorithm / hashComputedAt on a DocumentVersion
 *  - verifyIntegrity(docId, vn, caller, isAdmin) : loads file, re-hashes, verifies signature, returns result DTO
 *
 * CRITICAL: This service NEVER returns signatureBytes to callers — only status + metadata.
 */
@Service
public class IntegrityService {

    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentAccessService documentAccessService;
    private final KeyStoreService keyStoreService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public IntegrityService(FileStorageService fileStorageService,
                            DocumentRepository documentRepository,
                            DocumentVersionRepository documentVersionRepository,
                            DocumentAccessService documentAccessService,
                            KeyStoreService keyStoreService,
                            AuditService auditService,
                            NotificationService notificationService) {
        this.fileStorageService = fileStorageService;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentAccessService = documentAccessService;
        this.keyStoreService = keyStoreService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    // -------------------------------------------------------------------------
    // Public API: Hash computation
    // -------------------------------------------------------------------------

    /**
     * Computes SHA-256 of the given byte array.
     * @return "sha256:<64-lowercase-hex>"
     */
    public String computeSha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(data);
            return "sha256:" + HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("[Phase 13] SHA-256 computation failed", e);
        }
    }

    /**
     * Stamps hash fields on a DocumentVersion before persisting.
     * Call this immediately after file bytes are available (upload, new version, restore).
     */
    public void stampHash(DocumentVersion version, byte[] fileBytes) {
        version.setFileHash(computeSha256(fileBytes));
        version.setHashAlgorithm("SHA-256");
        version.setHashComputedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
    }

    // -------------------------------------------------------------------------
    // Public API: Integrity + Signature Verification
    // -------------------------------------------------------------------------

    /**
     * Result object returned by verifyIntegrity().
     * signatureBytes is intentionally excluded.
     */
    public record IntegrityVerificationResult(
            Long documentId,
            Integer versionNumber,
            IntegrityStatus integrityStatus,
            String fileHash,
            String hashAlgorithm,
            Instant hashComputedAt,
            SignatureStatus signatureStatus,
            String signerUsername,
            Instant signedAt,
            String signatureAlgorithm,
            String certSerialNumber,
            String certSubject,
            Instant certValidFrom,
            Instant certValidUntil
    ) {}

    @Transactional
    public IntegrityVerificationResult verifyIntegrity(Long docId, int versionNumber,
                                                        String callerUsername, boolean isAdmin) {
        // 1. Load document + enforce ACL
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại: " + docId));

        documentAccessService.requireRead(doc, callerUsername, isAdmin);

        // 2. Load the specific version
        DocumentVersion version = documentVersionRepository
                .findByDocumentIdAndVersionNumber(docId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên bản " + versionNumber + " của tài liệu " + docId + " không tồn tại."));

        // 3. Load physical file bytes
        byte[] fileBytes;
        try {
            Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
            fileBytes = Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("[Phase 13] Không thể đọc tệp vật lý: " + version.getStoredFileName(), e);
        }

        // 4. Check integrity
        IntegrityStatus integrityStatus;
        if (version.getFileHash() == null) {
            // Controlled backfill on first verify for genuine legacy version without stored hash
            String computedHash = computeSha256(fileBytes);
            version.setFileHash(computedHash);
            version.setHashAlgorithm("SHA-256");
            version.setHashComputedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
            documentVersionRepository.save(version);
            integrityStatus = IntegrityStatus.INTACT;
        } else {
            String currentHash = computeSha256(fileBytes);
            if (currentHash.equals(version.getFileHash())) {
                integrityStatus = IntegrityStatus.INTACT;
            } else {
                integrityStatus = IntegrityStatus.TAMPERED;
                // CRITICAL (Requirement 8): NEVER backfill or overwrite mismatched hash!
                // Original trusted stored hash is strictly preserved as forensic evidence.
            }
        }

        // 5. Check digital signature
        SignatureStatus signatureStatus = SignatureStatus.UNSIGNED;
        if (version.getSignatureBytes() != null && version.getSignatureBytes().length > 0) {
            signatureStatus = verifyRsaSignature(fileBytes, version.getSignatureBytes());
        }

        // 6. Collect certificate metadata
        String certSubject = null;
        Instant certValidFrom = null;
        Instant certValidUntil = null;
        if (version.getSignatureBytes() != null) {
            var cert = keyStoreService.getSigningCertificate();
            if (cert != null) {
                certSubject = cert.getSubjectX500Principal().getName();
                certValidFrom = cert.getNotBefore().toInstant();
                certValidUntil = cert.getNotAfter().toInstant();
            }
        }

        // 7. Audit log
        auditService.log(
                callerUsername,
                "DOCUMENT_INTEGRITY_VERIFIED",
                "DOCUMENT_VERSION",
                docId + "/v" + versionNumber,
                "integrity=" + integrityStatus + " signature=" + signatureStatus,
                null);

        // Section 12: Trigger deduplicated tamper alert if TAMPERED detected
        if (integrityStatus == IntegrityStatus.TAMPERED) {
            notificationService.publishTamperAlert(docId, versionNumber, doc.getCreatedBy());
        }

        return new IntegrityVerificationResult(
                docId, versionNumber,
                integrityStatus, version.getFileHash(), version.getHashAlgorithm(), version.getHashComputedAt(),
                signatureStatus, version.getSignerUsername(), version.getSignedAt(),
                version.getSignatureAlgorithm(), version.getCertSerialNumber(),
                certSubject, certValidFrom, certValidUntil);
    }

    /**
     * Phase 14: Public verification without user session requirement (e.g. via QR code).
     */
    @Transactional
    public IntegrityVerificationResult verifyIntegrityDirect(Document doc, DocumentVersion version) {
        byte[] fileBytes;
        try {
            Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
            fileBytes = Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("[Phase 14] Không thể đọc tệp vật lý: " + version.getStoredFileName(), e);
        }

        IntegrityStatus integrityStatus;
        if (version.getFileHash() == null) {
            String computedHash = computeSha256(fileBytes);
            version.setFileHash(computedHash);
            version.setHashAlgorithm("SHA-256");
            version.setHashComputedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
            documentVersionRepository.save(version);
            integrityStatus = IntegrityStatus.INTACT;
        } else {
            String currentHash = computeSha256(fileBytes);
            if (currentHash.equals(version.getFileHash())) {
                integrityStatus = IntegrityStatus.INTACT;
            } else {
                integrityStatus = IntegrityStatus.TAMPERED;
            }
        }

        SignatureStatus signatureStatus = SignatureStatus.UNSIGNED;
        if (version.getSignatureBytes() != null && version.getSignatureBytes().length > 0) {
            signatureStatus = verifyRsaSignature(fileBytes, version.getSignatureBytes());
        }

        String certSubject = null;
        Instant certValidFrom = null;
        Instant certValidUntil = null;
        if (version.getSignatureBytes() != null) {
            var cert = keyStoreService.getSigningCertificate();
            if (cert != null) {
                certSubject = cert.getSubjectX500Principal().getName();
                certValidFrom = cert.getNotBefore().toInstant();
                certValidUntil = cert.getNotAfter().toInstant();
            }
        }

        auditService.log(
                "ANONYMOUS_PUBLIC",
                "DOCUMENT_PUBLIC_VERIFIED",
                "DOCUMENT_VERSION",
                doc.getId() + "/v" + version.getVersionNumber(),
                "integrity=" + integrityStatus + " signature=" + signatureStatus,
                null);

        return new IntegrityVerificationResult(
                doc.getId(), version.getVersionNumber(),
                integrityStatus, version.getFileHash(), version.getHashAlgorithm(), version.getHashComputedAt(),
                signatureStatus, version.getSignerUsername(), version.getSignedAt(),
                version.getSignatureAlgorithm(), version.getCertSerialNumber(),
                certSubject, certValidFrom, certValidUntil);
    }

    // -------------------------------------------------------------------------
    // Internal: RSA signature verification
    // -------------------------------------------------------------------------

    private SignatureStatus verifyRsaSignature(byte[] data, byte[] sigBytes) {
        try {
            java.security.cert.X509Certificate cert = keyStoreService.getSigningCertificate();
            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(cert.getPublicKey());
            verifier.update(data);
            boolean valid = verifier.verify(sigBytes);
            return valid ? SignatureStatus.VALID : SignatureStatus.INVALID;
        } catch (Exception e) {
            return SignatureStatus.INVALID;
        }
    }
}
