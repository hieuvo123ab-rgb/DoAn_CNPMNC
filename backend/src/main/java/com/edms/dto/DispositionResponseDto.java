package com.edms.dto;

import com.edms.entity.Document;
import com.edms.entity.DocumentDisposition;

import java.time.Instant;
import java.time.LocalDate;

public class DispositionResponseDto {

    private Long requestId;
    private Long documentId;
    private String documentTitle;
    private Integer currentVersion;
    private String status;
    private String reason;
    private String requestedBy;
    private Instant requestedAt;
    private String reviewedBy;
    private Instant reviewedAt;
    private String reviewComment;
    private Instant disposedAt;
    private String disposedBy;

    // Document state snapshot
    private LocalDate retentionUntil;
    private boolean legalHold;
    private boolean eligibleForDisposition;

    public DispositionResponseDto() {
    }

    public static DispositionResponseDto fromEntity(DocumentDisposition disposition) {
        DispositionResponseDto dto = new DispositionResponseDto();
        dto.setRequestId(disposition.getId());
        dto.setStatus(disposition.getStatus() != null ? disposition.getStatus().name() : "PENDING");
        dto.setReason(disposition.getReason());
        dto.setRequestedBy(disposition.getRequestedBy());
        dto.setRequestedAt(disposition.getRequestedAt());
        dto.setReviewedBy(disposition.getReviewedBy());
        dto.setReviewedAt(disposition.getReviewedAt());
        dto.setReviewComment(disposition.getReviewComment());
        dto.setDisposedAt(disposition.getDisposedAt());
        dto.setDisposedBy(disposition.getDisposedBy());
        dto.setCurrentVersion(disposition.getVersionNumber());

        Document doc = disposition.getDocument();
        if (doc != null) {
            dto.setDocumentId(doc.getId());
            dto.setDocumentTitle(doc.getTitle());
            dto.setRetentionUntil(doc.getRetentionUntil());
            dto.setLegalHold(doc.isLegalHold());
            dto.setEligibleForDisposition(DocumentResponse.calculateDispositionEligibility(
                    doc.getLifecycleStatus(),
                    doc.isLegalHold(),
                    doc.getRetentionUntil(),
                    "APPROVED"
            ));
        }
        return dto;
    }

    public static DispositionResponseDto fromEntity(DocumentDisposition disposition, String currentReviewStatus) {
        DispositionResponseDto dto = fromEntity(disposition);
        Document doc = disposition.getDocument();
        if (doc != null) {
            dto.setEligibleForDisposition(DocumentResponse.calculateDispositionEligibility(
                    doc.getLifecycleStatus(),
                    doc.isLegalHold(),
                    doc.getRetentionUntil(),
                    currentReviewStatus
            ));
        }
        return dto;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getDocumentTitle() {
        return documentTitle;
    }

    public void setDocumentTitle(String documentTitle) {
        this.documentTitle = documentTitle;
    }

    public Integer getCurrentVersion() {
        return currentVersion;
    }

    public void setCurrentVersion(Integer currentVersion) {
        this.currentVersion = currentVersion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
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

    public boolean isEligibleForDisposition() {
        return eligibleForDisposition;
    }

    public void setEligibleForDisposition(boolean eligibleForDisposition) {
        this.eligibleForDisposition = eligibleForDisposition;
    }
}
