package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "investigation_events", indexes = {
    @Index(name = "idx_invevt_case_id", columnList = "case_id"),
    @Index(name = "idx_invevt_timestamp", columnList = "timestamp")
})
public class InvestigationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "user_full_name", length = 100)
    private String userFullName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "event_data", columnDefinition = "TEXT")
    private String eventData;

    @Column(nullable = false)
    private Instant timestamp;

    public InvestigationEvent() {
    }

    public InvestigationEvent(Long caseId, String eventType, String username, String userFullName, String description, String eventData) {
        this.caseId = caseId;
        this.eventType = eventType;
        this.username = username;
        this.userFullName = userFullName;
        this.description = description;
        this.eventData = eventData;
        this.timestamp = Instant.now();
    }

    public InvestigationEvent(Long caseId, String eventType, String description, String username, String eventData) {
        this.caseId = caseId;
        this.eventType = eventType;
        this.description = description;
        this.username = username;
        this.userFullName = username;
        this.eventData = eventData;
        this.timestamp = Instant.now();
    }

    public String getActor() {
        return username;
    }

    public String getSource() {
        return eventData;
    }

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
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

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEventData() {
        return eventData;
    }

    public void setEventData(String eventData) {
        this.eventData = eventData;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
