package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "investigation_cases", indexes = {
    @Index(name = "idx_inv_case_number", columnList = "case_number", unique = true),
    @Index(name = "idx_inv_status", columnList = "status"),
    @Index(name = "idx_inv_assigned_to", columnList = "assigned_to"),
    @Index(name = "idx_inv_created_by", columnList = "created_by")
})
public class InvestigationCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_number", nullable = false, unique = true, length = 50)
    private String caseNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 50)
    private InvestigationReason reason = InvestigationReason.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private InvestigationSeverity severity = InvestigationSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private InvestigationStatus status = InvestigationStatus.OPEN;

    @Column(name = "assigned_to", nullable = false, length = 50)
    private String assignedTo;

    @Column(name = "assigned_to_full_name", length = 100)
    private String assignedToFullName;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "target_document_id")
    private Long targetDocumentId;

    @Column(name = "target_document_title", length = 255)
    private String targetDocumentTitle;

    @Column(name = "vdr_event_id")
    private Long vdrEventId;

    @Column(name = "conclusion", columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "conclusion_submitted_at")
    private Instant conclusionSubmittedAt;

    @Column(name = "conclusion_approved_by", length = 50)
    private String conclusionApprovedBy;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public InvestigationCase() {
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isOverdue() {
        if (dueDate == null) return false;
        if (status == InvestigationStatus.CLOSED) return false;
        return Instant.now().isAfter(dueDate);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaseNumber() {
        return caseNumber;
    }

    public void setCaseNumber(String caseNumber) {
        this.caseNumber = caseNumber;
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

    public InvestigationReason getReason() {
        return reason;
    }

    public void setReason(InvestigationReason reason) {
        this.reason = reason;
    }

    public InvestigationSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(InvestigationSeverity severity) {
        this.severity = severity;
    }

    public InvestigationStatus getStatus() {
        return status;
    }

    public void setStatus(InvestigationStatus status) {
        this.status = status;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getAssignedToFullName() {
        return assignedToFullName;
    }

    public void setAssignedToFullName(String assignedToFullName) {
        this.assignedToFullName = assignedToFullName;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Long getTargetDocumentId() {
        return targetDocumentId;
    }

    public void setTargetDocumentId(Long targetDocumentId) {
        this.targetDocumentId = targetDocumentId;
    }

    public String getTargetDocumentTitle() {
        return targetDocumentTitle;
    }

    public void setTargetDocumentTitle(String targetDocumentTitle) {
        this.targetDocumentTitle = targetDocumentTitle;
    }

    public Long getVdrEventId() {
        return vdrEventId;
    }

    public void setVdrEventId(Long vdrEventId) {
        this.vdrEventId = vdrEventId;
    }

    public String getConclusion() {
        return conclusion;
    }

    public void setConclusion(String conclusion) {
        this.conclusion = conclusion;
    }

    public Instant getConclusionSubmittedAt() {
        return conclusionSubmittedAt;
    }

    public void setConclusionSubmittedAt(Instant conclusionSubmittedAt) {
        this.conclusionSubmittedAt = conclusionSubmittedAt;
    }

    public String getConclusionApprovedBy() {
        return conclusionApprovedBy;
    }

    public void setConclusionApprovedBy(String conclusionApprovedBy) {
        this.conclusionApprovedBy = conclusionApprovedBy;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
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
}
