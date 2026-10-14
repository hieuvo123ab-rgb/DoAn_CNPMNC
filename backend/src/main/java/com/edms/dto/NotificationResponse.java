package com.edms.dto;

import com.edms.entity.Notification;
import com.edms.entity.NotificationType;

import java.time.Instant;

public class NotificationResponse {

    private Long id;
    private String recipientUsername;
    private NotificationType type;
    private String title;
    private String message;
    private Long documentId;
    private Integer versionNumber;
    private String relatedEntityType;
    private Long relatedEntityId;
    private boolean read;
    private Instant createdAt;
    private Instant readAt;
    private String actionKey;

    public NotificationResponse() {
    }

    public static NotificationResponse fromEntity(Notification n) {
        if (n == null) return null;
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setRecipientUsername(n.getRecipientUsername());
        res.setType(n.getType());
        res.setTitle(n.getTitle());
        res.setMessage(n.getMessage());
        res.setDocumentId(n.getDocumentId());
        res.setVersionNumber(n.getVersionNumber());
        res.setRelatedEntityType(n.getRelatedEntityType());
        res.setRelatedEntityId(n.getRelatedEntityId());
        res.setRead(n.isRead());
        res.setCreatedAt(n.getCreatedAt());
        res.setReadAt(n.getReadAt());
        res.setActionKey(n.getActionKey());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecipientUsername() {
        return recipientUsername;
    }

    public void setRecipientUsername(String recipientUsername) {
        this.recipientUsername = recipientUsername;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public String getActionKey() {
        return actionKey;
    }

    public void setActionKey(String actionKey) {
        this.actionKey = actionKey;
    }
}
