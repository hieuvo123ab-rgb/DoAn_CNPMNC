package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "investigation_evidences", indexes = {
    @Index(name = "idx_invev_case_id", columnList = "case_id"),
    @Index(name = "idx_invev_doc_version", columnList = "document_id, version_number")
})
public class InvestigationEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

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

    @Column(name = "file_hash", nullable = false, length = 100)
    private String fileHash;

    @Column(name = "legal_hold_applied", nullable = false)
    private boolean legalHoldApplied = false;

    @Column(name = "collected_by", nullable = false, length = 50)
    private String collectedBy;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public InvestigationEvidence() {
    }

    @PrePersist
    public void prePersist() {
        if (this.collectedAt == null) {
            this.collectedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
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

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public boolean isLegalHoldApplied() {
        return legalHoldApplied;
    }

    public void setLegalHoldApplied(boolean legalHoldApplied) {
        this.legalHoldApplied = legalHoldApplied;
    }

    public String getCollectedBy() {
        return collectedBy;
    }

    public void setCollectedBy(String collectedBy) {
        this.collectedBy = collectedBy;
    }

    public Instant getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(Instant collectedAt) {
        this.collectedAt = collectedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
