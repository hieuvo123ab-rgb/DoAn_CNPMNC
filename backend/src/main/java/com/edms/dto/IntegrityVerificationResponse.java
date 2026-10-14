package com.edms.dto;

import com.edms.model.IntegrityStatus;
import com.edms.model.SignatureStatus;
import com.edms.service.IntegrityService.IntegrityVerificationResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Phase 13: REST response for document integrity + signature verification.
 *
 * SECURITY: signatureBytes is intentionally omitted.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IntegrityVerificationResponse {

    private Long documentId;
    private Integer versionNumber;

    // Integrity
    private IntegrityStatus integrityStatus;
    private String fileHash;
    private String hashAlgorithm;
    private Instant hashComputedAt;

    // Signature
    private SignatureStatus signatureStatus;
    private String signerUsername;
    private Instant signedAt;
    private String signatureAlgorithm;

    // Certificate info (public only)
    private String certSerialNumber;
    private String certSubject;
    private Instant certValidFrom;
    private Instant certValidUntil;

    public IntegrityVerificationResponse() {}

    public static IntegrityVerificationResponse from(IntegrityVerificationResult result) {
        IntegrityVerificationResponse r = new IntegrityVerificationResponse();
        r.documentId = result.documentId();
        r.versionNumber = result.versionNumber();
        r.integrityStatus = result.integrityStatus();
        r.fileHash = result.fileHash();
        r.hashAlgorithm = result.hashAlgorithm();
        r.hashComputedAt = result.hashComputedAt();
        r.signatureStatus = result.signatureStatus();
        r.signerUsername = result.signerUsername();
        r.signedAt = result.signedAt();
        r.signatureAlgorithm = result.signatureAlgorithm();
        r.certSerialNumber = result.certSerialNumber();
        r.certSubject = result.certSubject();
        r.certValidFrom = result.certValidFrom();
        r.certValidUntil = result.certValidUntil();
        return r;
    }

    // Getters
    public Long getDocumentId() { return documentId; }
    public Integer getVersionNumber() { return versionNumber; }
    public IntegrityStatus getIntegrityStatus() { return integrityStatus; }
    public String getFileHash() { return fileHash; }
    public String getHashAlgorithm() { return hashAlgorithm; }
    public Instant getHashComputedAt() { return hashComputedAt; }
    public SignatureStatus getSignatureStatus() { return signatureStatus; }
    public String getSignerUsername() { return signerUsername; }
    public Instant getSignedAt() { return signedAt; }
    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public String getCertSerialNumber() { return certSerialNumber; }
    public String getCertSubject() { return certSubject; }
    public Instant getCertValidFrom() { return certValidFrom; }
    public Instant getCertValidUntil() { return certValidUntil; }
}
