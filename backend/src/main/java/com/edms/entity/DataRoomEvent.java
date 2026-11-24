package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vdr_events", indexes = {
    @Index(name = "idx_vdrevt_room_id", columnList = "room_id"),
    @Index(name = "idx_vdrevt_doc_id", columnList = "document_id"),
    @Index(name = "idx_vdrevt_timestamp", columnList = "timestamp")
})
public class DataRoomEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "document_id")
    private Long documentId;

    @Column(length = 50)
    private String username;

    @Column(length = 100)
    private String email;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "is_suspicious", nullable = false)
    private boolean suspicious = false;

    @Column(name = "investigation_case_id")
    private Long investigationCaseId;

    @Column(nullable = false)
    private Instant timestamp;

    public DataRoomEvent() {
    }

    public DataRoomEvent(Long roomId, Long documentId, String username, String email, String eventType, String description, String ipAddress, boolean suspicious) {
        this.roomId = roomId;
        this.documentId = documentId;
        this.username = username;
        this.email = email;
        this.eventType = eventType;
        this.description = description;
        this.ipAddress = ipAddress;
        this.suspicious = suspicious;
        this.timestamp = Instant.now();
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

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public boolean isSuspicious() {
        return suspicious;
    }

    public void setSuspicious(boolean suspicious) {
        this.suspicious = suspicious;
    }

    public Long getInvestigationCaseId() {
        return investigationCaseId;
    }

    public void setInvestigationCaseId(Long investigationCaseId) {
        this.investigationCaseId = investigationCaseId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
