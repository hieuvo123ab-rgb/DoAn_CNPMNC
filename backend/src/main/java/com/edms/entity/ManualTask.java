package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "manual_tasks", indexes = {
    @Index(name = "idx_manual_tasks_assignee", columnList = "assignee"),
    @Index(name = "idx_manual_tasks_created_by", columnList = "created_by"),
    @Index(name = "idx_manual_tasks_status", columnList = "status"),
    @Index(name = "idx_manual_tasks_due_date", columnList = "due_date"),
    @Index(name = "idx_manual_tasks_document_id", columnList = "document_id")
})
public class ManualTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String assignee;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ManualTaskPriority priority = ManualTaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ManualTaskStatus status = ManualTaskStatus.TODO;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "document_title", length = 255)
    private String documentTitle;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public ManualTask() {
    }

    public ManualTask(String title, String description, String assignee, String createdBy,
                      ManualTaskPriority priority, Instant dueDate, Long documentId, String documentTitle, String notes) {
        this.title = title;
        this.description = description;
        this.assignee = assignee;
        this.createdBy = createdBy;
        this.priority = priority != null ? priority : ManualTaskPriority.MEDIUM;
        this.status = ManualTaskStatus.TODO;
        this.dueDate = dueDate;
        this.documentId = documentId;
        this.documentTitle = documentTitle;
        this.notes = notes;
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
        if (this.priority == null) {
            this.priority = ManualTaskPriority.MEDIUM;
        }
        if (this.status == null) {
            this.status = ManualTaskStatus.TODO;
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

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public ManualTaskPriority getPriority() {
        return priority;
    }

    public void setPriority(ManualTaskPriority priority) {
        this.priority = priority;
    }

    public ManualTaskStatus getStatus() {
        return status;
    }

    public void setStatus(ManualTaskStatus status) {
        this.status = status;
        if (status == ManualTaskStatus.DONE) {
            this.completedAt = Instant.now();
        } else if (status != ManualTaskStatus.DONE) {
            this.completedAt = null;
        }
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isOverdue() {
        if (this.status == ManualTaskStatus.DONE || this.status == ManualTaskStatus.CANCELLED) {
            return false;
        }
        return this.dueDate != null && Instant.now().isAfter(this.dueDate);
    }
}
