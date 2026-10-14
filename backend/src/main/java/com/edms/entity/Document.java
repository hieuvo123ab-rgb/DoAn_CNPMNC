package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_mode", nullable = false, length = 20)
    private AccessMode accessMode = AccessMode.INTERNAL;

    @Column(name = "current_version_number", nullable = false)
    private Integer currentVersionNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 20)
    private LifecycleStatus lifecycleStatus = LifecycleStatus.ACTIVE;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "archived_by", length = 50)
    private String archivedBy;

    @Column(name = "retention_until")
    private LocalDate retentionUntil;

    @Column(name = "legal_hold", nullable = false)
    private boolean legalHold = false;

    @Column(name = "legal_hold_reason", length = 1000)
    private String legalHoldReason;

    @Column(name = "legal_hold_set_at")
    private Instant legalHoldSetAt;

    @Column(name = "legal_hold_set_by", length = 50)
    private String legalHoldSetBy;

    @Column(name = "disposed_at")
    private Instant disposedAt;

    @Column(name = "disposed_by", length = 50)
    private String disposedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Document() {
    }

    public Document(String title, String description, String documentType,
                    String originalFileName, String storedFileName,
                    String contentType, Long fileSize, String createdBy) {
        this(title, description, documentType, originalFileName, storedFileName, contentType, fileSize, createdBy, AccessMode.INTERNAL);
    }

    public Document(String title, String description, String documentType,
                    String originalFileName, String storedFileName,
                    String contentType, Long fileSize, String createdBy, AccessMode accessMode) {
        this.title = title;
        this.description = description;
        this.documentType = documentType;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.createdBy = createdBy;
        this.accessMode = accessMode != null ? accessMode : AccessMode.INTERNAL;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public AccessMode getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(AccessMode accessMode) {
        this.accessMode = accessMode != null ? accessMode : AccessMode.INTERNAL;
    }

    public Integer getCurrentVersionNumber() {
        return currentVersionNumber;
    }

    public void setCurrentVersionNumber(Integer currentVersionNumber) {
        this.currentVersionNumber = currentVersionNumber != null ? currentVersionNumber : 1;
    }

    public LifecycleStatus getLifecycleStatus() {
        return lifecycleStatus != null ? lifecycleStatus : LifecycleStatus.ACTIVE;
    }

    public void setLifecycleStatus(LifecycleStatus lifecycleStatus) {
        this.lifecycleStatus = lifecycleStatus != null ? lifecycleStatus : LifecycleStatus.ACTIVE;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }

    public String getArchivedBy() {
        return archivedBy;
    }

    public void setArchivedBy(String archivedBy) {
        this.archivedBy = archivedBy;
    }

    public LocalDate getRetentionUntil() {
        return retentionUntil;
    }

    public void setRetentionUntil(LocalDate retentionUntil) {
        this.retentionUntil = retentionUntil;
    }

    public boolean isLegalHold() {
        return legalHold;
    }

    public void setLegalHold(boolean legalHold) {
        this.legalHold = legalHold;
    }

    public String getLegalHoldReason() {
        return legalHoldReason;
    }

    public void setLegalHoldReason(String legalHoldReason) {
        this.legalHoldReason = legalHoldReason;
    }

    public Instant getLegalHoldSetAt() {
        return legalHoldSetAt;
    }

    public void setLegalHoldSetAt(Instant legalHoldSetAt) {
        this.legalHoldSetAt = legalHoldSetAt;
    }

    public String getLegalHoldSetBy() {
        return legalHoldSetBy;
    }

    public void setLegalHoldSetBy(String legalHoldSetBy) {
        this.legalHoldSetBy = legalHoldSetBy;
    }

    public Instant getDisposedAt() {
        return disposedAt;
    }

    public void setDisposedAt(Instant disposedAt) {
        this.disposedAt = disposedAt;
    }

    public String getDisposedBy() {
        return disposedBy;
    }

    public void setDisposedBy(String disposedBy) {
        this.disposedBy = disposedBy;
    }
}
