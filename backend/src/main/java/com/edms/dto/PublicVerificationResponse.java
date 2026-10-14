package com.edms.dto;

import com.edms.model.IntegrityStatus;
import com.edms.model.SignatureStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Phase 14: REST response for public QR code / file verification.
 * Does not expose any private key, internal storage paths, or sensitive internal data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicVerificationResponse {

    private boolean found;
    private Long documentId;
    private String title;
    private Integer versionNumber;
    private String documentType;
    private String fileHash;
    private String hashAlgorithm;
    private IntegrityStatus integrityStatus;
    private SignatureStatus signatureStatus;
    private String signerUsername;
    private Instant signedAt;
    private String certSerialNumber;
    private String certSubject;
    private Instant certValidFrom;
    private Instant certValidUntil;
    private Instant verifiedAt;
    private boolean isTampered;
    private String message;

    public PublicVerificationResponse() {}

    public static PublicVerificationResponse notFound(String message) {
        PublicVerificationResponse r = new PublicVerificationResponse();
        r.setFound(false);
        r.setMessage(message);
        r.setVerifiedAt(Instant.now());
        return r;
    }

    public boolean isFound() {
        return found;
    }

    public void setFound(boolean found) {
        this.found = found;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public String getHashAlgorithm() {
        return hashAlgorithm;
    }

    public void setHashAlgorithm(String hashAlgorithm) {
        this.hashAlgorithm = hashAlgorithm;
    }

    public IntegrityStatus getIntegrityStatus() {
        return integrityStatus;
    }

    public void setIntegrityStatus(IntegrityStatus integrityStatus) {
        this.integrityStatus = integrityStatus;
    }

    public SignatureStatus getSignatureStatus() {
        return signatureStatus;
    }

    public void setSignatureStatus(SignatureStatus signatureStatus) {
        this.signatureStatus = signatureStatus;
    }

    public String getSignerUsername() {
        return signerUsername;
    }

    public void setSignerUsername(String signerUsername) {
        this.signerUsername = signerUsername;
    }

    public Instant getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(Instant signedAt) {
        this.signedAt = signedAt;
    }

    public String getCertSerialNumber() {
        return certSerialNumber;
    }

    public void setCertSerialNumber(String certSerialNumber) {
        this.certSerialNumber = certSerialNumber;
    }

    public String getCertSubject() {
        return certSubject;
    }

    public void setCertSubject(String certSubject) {
        this.certSubject = certSubject;
    }

    public Instant getCertValidFrom() {
        return certValidFrom;
    }

    public void setCertValidFrom(Instant certValidFrom) {
        this.certValidFrom = certValidFrom;
    }

    public Instant getCertValidUntil() {
        return certValidUntil;
    }

    public void setCertValidUntil(Instant certValidUntil) {
        this.certValidUntil = certValidUntil;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public boolean isTampered() {
        return isTampered;
    }

    public void setTampered(boolean tampered) {
        isTampered = tampered;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
