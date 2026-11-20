package com.edms.dto;

import com.edms.entity.InvestigationReason;
import com.edms.entity.InvestigationSeverity;
import com.edms.entity.InvestigationStatus;

import java.time.Instant;

public class InvestigationCaseResponse {

    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private InvestigationReason reason;
    private InvestigationSeverity severity;
    private InvestigationStatus status;
    private String assignedTo;
    private String assignedToFullName;
    private String createdBy;
    private Instant dueDate;
    private boolean overdue;
    private Long targetDocumentId;
    private String targetDocumentTitle;
    private Long vdrEventId;
    private String conclusion;
    private Instant conclusionSubmittedAt;
    private String conclusionApprovedBy;
    private Instant closedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private int evidenceCount;
    private int findingsCount;
    private int eventsCount;

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

    public boolean isOverdue() {
        return overdue;
    }

    public void setOverdue(boolean overdue) {
        this.overdue = overdue;
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

    public int getEvidenceCount() {
        return evidenceCount;
    }

    public void setEvidenceCount(int evidenceCount) {
        this.evidenceCount = evidenceCount;
    }

    public int getFindingsCount() {
        return findingsCount;
    }

    public void setFindingsCount(int findingsCount) {
        this.findingsCount = findingsCount;
    }

    public int getEventsCount() {
        return eventsCount;
    }

    public void setEventsCount(int eventsCount) {
        this.eventsCount = eventsCount;
    }
}
