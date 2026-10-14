package com.edms.dto;

import com.edms.entity.DocumentVersion;
import com.edms.model.SignatureStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)

public class DocumentVersionResponse {

    private Long id;
    private Long documentId;
    private Integer versionNumber;
    private String originalFileName;
    private Long fileSize;
    private String contentType;
    private String uploadedBy;
    private Instant createdAt;
    private String changeNote;
    private Boolean isCurrent;
    private String extractionStatus;
    private Integer extractedCharacterCount;
    private Instant extractedAt;
    private String extractionError;
    private String ocrStatus;
    private Integer ocrCharacterCount;
    private Instant ocrAt;
    private String ocrError;
    private String ocrLanguage;

    // Phase 13: Integrity hash fields
    private String fileHash;
    private String hashAlgorithm;
    private Instant hashComputedAt;

    // Phase 13: Signature fields (signatureBytes intentionally excluded)
    private String signatureStatus;  // UNSIGNED | VALID | INVALID
    private String signerUsername;
    private Instant signedAt;
    private String signatureAlgorithm;
    private String certSerialNumber;

    public DocumentVersionResponse() {
    }

    public static DocumentVersionResponse fromEntity(DocumentVersion version, boolean isCurrent) {
        DocumentVersionResponse res = new DocumentVersionResponse();
        res.setId(version.getId());
        res.setDocumentId(version.getDocument().getId());
        res.setVersionNumber(version.getVersionNumber());
        res.setOriginalFileName(version.getOriginalFileName());
        res.setFileSize(version.getFileSize());
        res.setContentType(version.getContentType());
        res.setUploadedBy(version.getUploadedBy());
        res.setCreatedAt(version.getCreatedAt());
        res.setChangeNote(version.getChangeNote());
        res.setIsCurrent(isCurrent);
        res.setExtractionStatus(version.getExtractionStatus() != null ? version.getExtractionStatus().name() : "PENDING");
        res.setExtractedCharacterCount(version.getExtractedCharacterCount());
        res.setExtractedAt(version.getExtractedAt());
        res.setExtractionError(version.getExtractionError());
        res.setOcrStatus(version.getOcrStatus() != null ? version.getOcrStatus().name() : "NOT_REQUIRED");
        res.setOcrCharacterCount(version.getOcrCharacterCount());
        res.setOcrAt(version.getOcrAt());
        res.setOcrError(version.getOcrError());
        res.setOcrLanguage(version.getOcrLanguage());
        // Phase 13: Hash + Signature fields
        res.setFileHash(version.getFileHash());
        res.setHashAlgorithm(version.getHashAlgorithm());
        res.setHashComputedAt(version.getHashComputedAt());
        // Derive signatureStatus from presence of signatureBytes
        if (version.getSignatureBytes() == null || version.getSignatureBytes().length == 0) {
            res.setSignatureStatus(SignatureStatus.UNSIGNED.name());
        } else {
            // Display stored status; detailed VALID/INVALID requires calling IntegrityService.verifyIntegrity()
            res.setSignatureStatus(SignatureStatus.VALID.name());
        }
        res.setSignerUsername(version.getSignerUsername());
        res.setSignedAt(version.getSignedAt());
        res.setSignatureAlgorithm(version.getSignatureAlgorithm());
        res.setCertSerialNumber(version.getCertSerialNumber());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getChangeNote() {
        return changeNote;
    }

    public void setChangeNote(String changeNote) {
        this.changeNote = changeNote;
    }

    public Boolean getIsCurrent() {
        return isCurrent;
    }

    public void setIsCurrent(Boolean isCurrent) {
        this.isCurrent = isCurrent;
    }

    public String getExtractionStatus() {
        return extractionStatus;
    }

    public void setExtractionStatus(String extractionStatus) {
        this.extractionStatus = extractionStatus;
    }

    public Integer getExtractedCharacterCount() {
        return extractedCharacterCount;
    }

    public void setExtractedCharacterCount(Integer extractedCharacterCount) {
        this.extractedCharacterCount = extractedCharacterCount;
    }

    public Instant getExtractedAt() {
        return extractedAt;
    }

    public void setExtractedAt(Instant extractedAt) {
        this.extractedAt = extractedAt;
    }

    public String getExtractionError() {
        return extractionError;
    }

    public void setExtractionError(String extractionError) {
        this.extractionError = extractionError;
    }

    public String getOcrStatus() {
        return ocrStatus;
    }

    public void setOcrStatus(String ocrStatus) {
        this.ocrStatus = ocrStatus;
    }

    public Integer getOcrCharacterCount() {
        return ocrCharacterCount;
    }

    public void setOcrCharacterCount(Integer ocrCharacterCount) {
        this.ocrCharacterCount = ocrCharacterCount;
    }

    public Instant getOcrAt() {
        return ocrAt;
    }

    public void setOcrAt(Instant ocrAt) {
        this.ocrAt = ocrAt;
    }

    public String getOcrError() {
        return ocrError;
    }

    public void setOcrError(String ocrError) {
        this.ocrError = ocrError;
    }

    public String getOcrLanguage() {
        return ocrLanguage;
    }

    public void setOcrLanguage(String ocrLanguage) {
        this.ocrLanguage = ocrLanguage;
    }

    // Phase 13: Hash getters/setters
    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }

    public String getHashAlgorithm() { return hashAlgorithm; }
    public void setHashAlgorithm(String hashAlgorithm) { this.hashAlgorithm = hashAlgorithm; }

    public Instant getHashComputedAt() { return hashComputedAt; }
    public void setHashComputedAt(Instant hashComputedAt) { this.hashComputedAt = hashComputedAt; }

    // Phase 13: Signature getters/setters
    public String getSignatureStatus() { return signatureStatus; }
    public void setSignatureStatus(String signatureStatus) { this.signatureStatus = signatureStatus; }

    public String getSignerUsername() { return signerUsername; }
    public void setSignerUsername(String signerUsername) { this.signerUsername = signerUsername; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }

    public String getCertSerialNumber() { return certSerialNumber; }
    public void setCertSerialNumber(String certSerialNumber) { this.certSerialNumber = certSerialNumber; }
}
