package com.edms.dto;

import com.edms.entity.Document;
import com.edms.entity.LifecycleStatus;
import java.time.Instant;
import java.time.LocalDate;

public class DocumentResponse {

    private Long id;
    private String title;
    private String description;
    private String documentType;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private String createdBy;
    private String accessMode;
    private String userPermission;
    private Integer currentVersionNumber;
    private String currentReviewStatus = "DRAFT";
    private String reviewStatus = "DRAFT";
    private String lifecycleStatus = "ACTIVE";
    private Instant archivedAt;
    private String archivedBy;
    private LocalDate retentionUntil;
    private boolean legalHold = false;
    private String legalHoldReason;
    private Instant legalHoldSetAt;
    private String legalHoldSetBy;
    private Instant disposedAt;
    private String disposedBy;
    private boolean eligibleForDisposition = false;
    private String matchSnippet;
    private Boolean contentMatched = false;
    private String extractionStatus;
    private String ocrStatus;
    private Integer ocrCharacterCount;
    private Instant ocrAt;
    private String contentSource;
    private Instant createdAt;
    private Instant updatedAt;

    // Phase 12: Semantic search result fields
    // NOTE: Raw embeddings, chunk text, OCR text, extracted text are NEVER included
    private Boolean semanticMatched = false;
    private Double semanticScore;   // cosine similarity, only set in SEMANTIC/HYBRID mode
    private String searchMode;      // LEXICAL, SEMANTIC, or HYBRID

    public DocumentResponse() {
    }

    public static DocumentResponse fromEntity(Document doc) {
        DocumentResponse res = new DocumentResponse();
        res.setId(doc.getId());
        res.setTitle(doc.getTitle());
        res.setDescription(doc.getDescription());
        res.setDocumentType(doc.getDocumentType());
        res.setOriginalFileName(doc.getOriginalFileName());
        res.setContentType(doc.getContentType());
        res.setFileSize(doc.getFileSize());
        res.setCreatedBy(doc.getCreatedBy());
        res.setAccessMode(doc.getAccessMode() != null ? doc.getAccessMode().name() : "INTERNAL");
        res.setCurrentVersionNumber(doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1);
        res.setCurrentReviewStatus("DRAFT");
        res.setReviewStatus("DRAFT");
        res.setLifecycleStatus(doc.getLifecycleStatus() != null ? doc.getLifecycleStatus().name() : "ACTIVE");
        res.setArchivedAt(doc.getArchivedAt());
        res.setArchivedBy(doc.getArchivedBy());
        res.setRetentionUntil(doc.getRetentionUntil());
        res.setLegalHold(doc.isLegalHold());
        res.setLegalHoldReason(doc.getLegalHoldReason());
        res.setLegalHoldSetAt(doc.getLegalHoldSetAt());
        res.setLegalHoldSetBy(doc.getLegalHoldSetBy());
        res.setDisposedAt(doc.getDisposedAt());
        res.setDisposedBy(doc.getDisposedBy());
        res.setEligibleForDisposition(calculateDispositionEligibility(doc.getLifecycleStatus(), doc.isLegalHold(), doc.getRetentionUntil(), "DRAFT"));
        res.setCreatedAt(doc.getCreatedAt());
        res.setUpdatedAt(doc.getUpdatedAt());
        return res;
    }

    public static DocumentResponse fromEntity(Document doc, String userPermission) {
        DocumentResponse res = fromEntity(doc);
        res.setUserPermission(userPermission);
        return res;
    }

    public static DocumentResponse fromEntity(Document doc, String userPermission, String reviewStatus) {
        DocumentResponse res = fromEntity(doc, userPermission);
        String status = (reviewStatus != null && !reviewStatus.isBlank()) ? reviewStatus : "DRAFT";
        res.setCurrentReviewStatus(status);
        res.setReviewStatus(status);
        res.setEligibleForDisposition(calculateDispositionEligibility(doc.getLifecycleStatus(), doc.isLegalHold(), doc.getRetentionUntil(), status));
        return res;
    }

    public static boolean calculateDispositionEligibility(LifecycleStatus lifecycleStatus, boolean legalHold, LocalDate retentionUntil, String currentReviewStatus) {
        if (lifecycleStatus != LifecycleStatus.ARCHIVED) {
            return false;
        }
        if (legalHold) {
            return false;
        }
        if (retentionUntil == null) {
            return false;
        }
        if (LocalDate.now().isBefore(retentionUntil)) {
            return false;
        }
        if ("PENDING".equalsIgnoreCase(currentReviewStatus)) {
            return false;
        }
        return true;
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

    public String getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(String accessMode) {
        this.accessMode = accessMode;
    }

    public String getUserPermission() {
        return userPermission;
    }

    public void setUserPermission(String userPermission) {
        this.userPermission = userPermission;
    }

    public Integer getCurrentVersionNumber() {
        return currentVersionNumber;
    }

    public void setCurrentVersionNumber(Integer currentVersionNumber) {
        this.currentVersionNumber = currentVersionNumber;
    }

    public String getCurrentReviewStatus() {
        return currentReviewStatus;
    }

    public void setCurrentReviewStatus(String currentReviewStatus) {
        this.currentReviewStatus = currentReviewStatus;
    }

    public String getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(String reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getLifecycleStatus() {
        return lifecycleStatus != null ? lifecycleStatus : "ACTIVE";
    }

    public void setLifecycleStatus(String lifecycleStatus) {
        this.lifecycleStatus = lifecycleStatus != null ? lifecycleStatus : "ACTIVE";
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

    public boolean isEligibleForDisposition() {
        return eligibleForDisposition;
    }

    public void setEligibleForDisposition(boolean eligibleForDisposition) {
        this.eligibleForDisposition = eligibleForDisposition;
    }

    public String getMatchSnippet() {
        return matchSnippet;
    }

    public void setMatchSnippet(String matchSnippet) {
        this.matchSnippet = matchSnippet;
    }

    public Boolean getContentMatched() {
        return contentMatched;
    }

    public void setContentMatched(Boolean contentMatched) {
        this.contentMatched = contentMatched;
    }

    public String getExtractionStatus() {
        return extractionStatus;
    }

    public void setExtractionStatus(String extractionStatus) {
        this.extractionStatus = extractionStatus;
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

    public String getContentSource() {
        return contentSource;
    }

    public void setContentSource(String contentSource) {
        this.contentSource = contentSource;
    }

    // Phase 12: Semantic search getters/setters
    public Boolean getSemanticMatched() { return semanticMatched; }
    public void setSemanticMatched(Boolean semanticMatched) { this.semanticMatched = semanticMatched; }

    public Double getSemanticScore() { return semanticScore; }
    public void setSemanticScore(Double semanticScore) { this.semanticScore = semanticScore; }

    public String getSearchMode() { return searchMode; }
    public void setSearchMode(String searchMode) { this.searchMode = searchMode; }
}

