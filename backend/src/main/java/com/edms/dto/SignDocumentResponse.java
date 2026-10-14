package com.edms.dto;

import com.edms.service.SignatureService.SignatureResult;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Phase 13: REST response returned after successful digital signing of a DocumentVersion.
 *
 * SECURITY: signatureBytes / privateKey NEVER included.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SignDocumentResponse {

    private Long documentId;
    private Integer versionNumber;
    private String signatureAlgorithm;
    private String signerUsername;
    private Instant signedAt;
    private String certSerialNumber;
    private String certSubject;
    private Instant certValidFrom;
    private Instant certValidUntil;
    private String message;

    public SignDocumentResponse() {}

    public static SignDocumentResponse from(SignatureResult result) {
        SignDocumentResponse r = new SignDocumentResponse();
        r.documentId = result.documentId();
        r.versionNumber = result.versionNumber();
        r.signatureAlgorithm = result.signatureAlgorithm();
        r.signerUsername = result.signerUsername();
        r.signedAt = result.signedAt();
        r.certSerialNumber = result.certSerialNumber();
        r.certSubject = result.certSubject();
        r.certValidFrom = result.certValidFrom();
        r.certValidUntil = result.certValidUntil();
        r.message = result.message();
        return r;
    }

    // Getters
    public Long getDocumentId() { return documentId; }
    public Integer getVersionNumber() { return versionNumber; }
    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public String getSignerUsername() { return signerUsername; }
    public Instant getSignedAt() { return signedAt; }
    public String getCertSerialNumber() { return certSerialNumber; }
    public String getCertSubject() { return certSubject; }
    public Instant getCertValidFrom() { return certValidFrom; }
    public Instant getCertValidUntil() { return certValidUntil; }
    public String getMessage() { return message; }
}
