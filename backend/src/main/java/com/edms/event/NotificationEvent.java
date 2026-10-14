package com.edms.event;

import com.edms.entity.NotificationType;

public class NotificationEvent {

    private final String recipientUsername;
    private final NotificationType type;
    private final String title;
    private final String message;
    private final Long documentId;
    private final Integer versionNumber;
    private final String relatedEntityType;
    private final Long relatedEntityId;
    private final String actionKey;
    private final String eventKey;
    private final boolean forAdmins;
    private final String excludeUsername;
    private final boolean simulatePersistenceFailure;

    public NotificationEvent(String recipientUsername, NotificationType type, String title,
                             String message, Long documentId, Integer versionNumber,
                             String relatedEntityType, Long relatedEntityId, String actionKey,
                             String eventKey, boolean simulatePersistenceFailure) {
        this.recipientUsername = recipientUsername;
        this.type = type;
        this.title = title;
        this.message = message;
        this.documentId = documentId;
        this.versionNumber = versionNumber;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.actionKey = actionKey;
        this.eventKey = eventKey;
        this.forAdmins = false;
        this.excludeUsername = null;
        this.simulatePersistenceFailure = simulatePersistenceFailure;
    }

    public NotificationEvent(NotificationType type, String title, String message,
                             Long documentId, Integer versionNumber, String relatedEntityType,
                             Long relatedEntityId, String actionKey, String excludeUsername,
                             String eventKey, boolean simulatePersistenceFailure) {
        this.recipientUsername = null;
        this.type = type;
        this.title = title;
        this.message = message;
        this.documentId = documentId;
        this.versionNumber = versionNumber;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
        this.actionKey = actionKey;
        this.eventKey = eventKey;
        this.forAdmins = true;
        this.excludeUsername = excludeUsername;
        this.simulatePersistenceFailure = simulatePersistenceFailure;
    }

    public String getRecipientUsername() {
        return recipientUsername;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public String getActionKey() {
        return actionKey;
    }

    public String getEventKey() {
        return eventKey;
    }

    public boolean isForAdmins() {
        return forAdmins;
    }

    public String getExcludeUsername() {
        return excludeUsername;
    }

    public boolean isSimulatePersistenceFailure() {
        return simulatePersistenceFailure;
    }
}
