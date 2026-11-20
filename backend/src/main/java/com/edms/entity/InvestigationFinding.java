package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "investigation_findings", indexes = {
    @Index(name = "idx_invfnd_case_id", columnList = "case_id")
})
public class InvestigationFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String details;

    @Column(length = 50)
    private String category;

    @Column(name = "reported_by", nullable = false, length = 50)
    private String reportedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public InvestigationFinding() {
    }

    public InvestigationFinding(Long caseId, String title, String details, String category, String reportedBy) {
        this.caseId = caseId;
        this.title = title;
        this.details = details;
        this.category = category;
        this.reportedBy = reportedBy;
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

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
