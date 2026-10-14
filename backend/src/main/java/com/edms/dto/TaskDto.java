package com.edms.dto;

import java.time.Instant;

public class TaskDto {

    private TaskType taskType;
    private Long documentId;
    private String documentTitle;
    private Integer versionNumber;
    private Long relatedEntityId;
    private String status;
    private Instant createdAt;
    private String actionKey;
    private String priority;

    public TaskDto() {
    }

    public TaskDto(TaskType taskType, Long documentId, String documentTitle, Integer versionNumber,
                   Long relatedEntityId, String status, Instant createdAt, String actionKey, String priority) {
        this.taskType = taskType;
        this.documentId = documentId;
        this.documentTitle = documentTitle;
        this.versionNumber = versionNumber;
        this.relatedEntityId = relatedEntityId;
        this.status = status;
        this.createdAt = createdAt;
        this.actionKey = actionKey;
        this.priority = priority;
    }

    public TaskType getTaskType() {
        return taskType;
    }

    public void setTaskType(TaskType taskType) {
        this.taskType = taskType;
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

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getActionKey() {
        return actionKey;
    }

    public void setActionKey(String actionKey) {
        this.actionKey = actionKey;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }
}
