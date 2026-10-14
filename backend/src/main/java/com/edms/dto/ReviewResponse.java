package com.edms.dto;

import com.edms.entity.DocumentReview;
import java.time.Instant;

public class ReviewResponse {

    private Long reviewId;
    private Long documentId;
    private String documentTitle;
    private Integer versionNumber;
    private String originalFileName;
    private String status;
    private String submittedBy;
    private Instant submittedAt;
    private String reviewedBy;
    private Instant reviewedAt;
    private String reviewComment;

    public ReviewResponse() {
    }

    public static ReviewResponse fromEntity(DocumentReview review) {
        ReviewResponse res = new ReviewResponse();
        res.setReviewId(review.getId());
        if (review.getDocument() != null) {
            res.setDocumentId(review.getDocument().getId());
            res.setDocumentTitle(review.getDocument().getTitle());
            res.setOriginalFileName(review.getDocument().getOriginalFileName());
        }
        res.setVersionNumber(review.getVersionNumber());
        res.setStatus(review.getStatus() != null ? review.getStatus().name() : null);
        res.setSubmittedBy(review.getSubmittedBy());
        res.setSubmittedAt(review.getSubmittedAt());
        res.setReviewedBy(review.getReviewedBy());
        res.setReviewedAt(review.getReviewedAt());
        res.setReviewComment(review.getReviewComment());
        return res;
    }

    public static ReviewResponse fromEntity(DocumentReview review, String documentTitle, String originalFileName) {
        ReviewResponse res = fromEntity(review);
        if (documentTitle != null) {
            res.setDocumentTitle(documentTitle);
        }
        if (originalFileName != null) {
            res.setOriginalFileName(originalFileName);
        }
        return res;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(String submittedBy) {
        this.submittedBy = submittedBy;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
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
}
