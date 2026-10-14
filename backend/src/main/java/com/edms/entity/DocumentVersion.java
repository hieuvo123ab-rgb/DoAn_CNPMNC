package com.edms.entity;

import com.edms.model.ExtractionStatus;
import com.edms.model.SemanticStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "document_versions", uniqueConstraints = {
    @UniqueConstraint(name = "uq_document_version", columnNames = {"document_id", "version_number"})
})
public class DocumentVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "uploaded_by", nullable = false, length = 50)
    private String uploadedBy;

    @Column(name = "change_note", columnDefinition = "TEXT")
    private String changeNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_status", length = 30)
    private ExtractionStatus extractionStatus = ExtractionStatus.PENDING;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "extracted_at")
    private Instant extractedAt;

    @Column(name = "extraction_error", length = 500)
    private String extractionError;

    @Column(name = "extracted_character_count")
    private Integer extractedCharacterCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "ocr_status", length = 30)
    private com.edms.model.OcrStatus ocrStatus = com.edms.model.OcrStatus.NOT_REQUIRED;

    @Column(name = "ocr_text", columnDefinition = "TEXT")
    private String ocrText;

    @Column(name = "ocr_at")
    private Instant ocrAt;

    @Column(name = "ocr_error", length = 500)
    private String ocrError;

    @Column(name = "ocr_character_count")
    private Integer ocrCharacterCount;

    @Column(name = "ocr_language", length = 50)
    private String ocrLanguage;

    // Phase 12: Semantic indexing fields
    @Enumerated(EnumType.STRING)
    @Column(name = "semantic_status", length = 30)
    private SemanticStatus semanticStatus = SemanticStatus.PENDING;

    @Column(name = "semantic_model", length = 100)
    private String semanticModel;

    @Column(name = "semantic_indexed_at")
    private Instant semanticIndexedAt;

    @Column(name = "semantic_chunk_count")
    private Integer semanticChunkCount;

    @Column(name = "semantic_error", length = 500)
    private String semanticError;

    // Phase 13: File integrity hash fields
    /** SHA-256 hash of the physical file, format: "sha256:<64-char-hex>". Computed at upload time. */
    @Column(name = "file_hash", length = 80)
    private String fileHash;

    @Column(name = "hash_algorithm", length = 20)
    private String hashAlgorithm;

    @Column(name = "hash_computed_at")
    private Instant hashComputedAt;

    // Phase 13: Digital signature fields — signatureBytes NEVER exposed through REST
    @Column(name = "signature_bytes", columnDefinition = "BYTEA")
    private byte[] signatureBytes;

    @Column(name = "signature_algorithm", length = 50)
    private String signatureAlgorithm;

    @Column(name = "signer_username", length = 50)
    private String signerUsername;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "cert_serial_number", length = 100)
    private String certSerialNumber;

    public DocumentVersion() {
    }

    public DocumentVersion(Document document, Integer versionNumber, String originalFileName,
                           String storedFileName, String contentType, Long fileSize,
                           String uploadedBy, String changeNote) {
        this.document = document;
        this.versionNumber = versionNumber;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.uploadedBy = uploadedBy;
        this.changeNote = changeNote;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
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

    public String getStoredFileName() {
        return storedFileName;
    }

    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public String getChangeNote() {
        return changeNote;
    }

    public void setChangeNote(String changeNote) {
        this.changeNote = changeNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public ExtractionStatus getExtractionStatus() {
        return extractionStatus;
    }

    public void setExtractionStatus(ExtractionStatus extractionStatus) {
        this.extractionStatus = extractionStatus;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
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

    public Integer getExtractedCharacterCount() {
        return extractedCharacterCount;
    }

    public void setExtractedCharacterCount(Integer extractedCharacterCount) {
        this.extractedCharacterCount = extractedCharacterCount;
    }

    public com.edms.model.OcrStatus getOcrStatus() {
        return ocrStatus;
    }

    public void setOcrStatus(com.edms.model.OcrStatus ocrStatus) {
        this.ocrStatus = ocrStatus;
    }

    public String getOcrText() {
        return ocrText;
    }

    public void setOcrText(String ocrText) {
        this.ocrText = ocrText;
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

    public Integer getOcrCharacterCount() {
        return ocrCharacterCount;
    }

    public void setOcrCharacterCount(Integer ocrCharacterCount) {
        this.ocrCharacterCount = ocrCharacterCount;
    }

    public String getOcrLanguage() {
        return ocrLanguage;
    }

    public void setOcrLanguage(String ocrLanguage) {
        this.ocrLanguage = ocrLanguage;
    }

    // Phase 12: Semantic getters/setters
    public SemanticStatus getSemanticStatus() {
        return semanticStatus;
    }

    public void setSemanticStatus(SemanticStatus semanticStatus) {
        this.semanticStatus = semanticStatus;
    }

    public String getSemanticModel() {
        return semanticModel;
    }

    public void setSemanticModel(String semanticModel) {
        this.semanticModel = semanticModel;
    }

    public Instant getSemanticIndexedAt() {
        return semanticIndexedAt;
    }

    public void setSemanticIndexedAt(Instant semanticIndexedAt) {
        this.semanticIndexedAt = semanticIndexedAt;
    }

    public Integer getSemanticChunkCount() {
        return semanticChunkCount;
    }

    public void setSemanticChunkCount(Integer semanticChunkCount) {
        this.semanticChunkCount = semanticChunkCount;
    }

    public String getSemanticError() {
        return semanticError;
    }

    public void setSemanticError(String semanticError) {
        this.semanticError = semanticError;
    }

    // Phase 13: Hash getters/setters
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

    public Instant getHashComputedAt() {
        return hashComputedAt;
    }

    public void setHashComputedAt(Instant hashComputedAt) {
        this.hashComputedAt = hashComputedAt;
    }

    // Phase 13: Signature getters/setters — signatureBytes intentionally package-scoped
    public byte[] getSignatureBytes() {
        return signatureBytes;
    }

    public void setSignatureBytes(byte[] signatureBytes) {
        this.signatureBytes = signatureBytes;
    }

    public String getSignatureAlgorithm() {
        return signatureAlgorithm;
    }

    public void setSignatureAlgorithm(String signatureAlgorithm) {
        this.signatureAlgorithm = signatureAlgorithm;
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
}
