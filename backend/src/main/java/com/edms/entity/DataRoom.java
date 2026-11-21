package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vdr_data_rooms", indexes = {
    @Index(name = "idx_vdr_room_code", columnList = "room_code", unique = true),
    @Index(name = "idx_vdr_status", columnList = "status"),
    @Index(name = "idx_vdr_owner", columnList = "owner_username")
})
public class DataRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 50)
    private String roomCode;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "owner_username", nullable = false, length = 50)
    private String ownerUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private DataRoomStatus status = DataRoomStatus.DRAFT;

    @Column(name = "watermark_enabled", nullable = false)
    private boolean watermarkEnabled = true;

    @Column(name = "watermark_pattern", length = 255)
    private String watermarkPattern = "CONFIDENTIAL - {user} - {date}";

    @Column(name = "allow_download", nullable = false)
    private boolean allowDownload = false;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public DataRoom() {
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
        if (this.startDate == null) this.startDate = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isExpired() {
        if (expiresAt == null) return false;
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isAccessible() {
        if (status != DataRoomStatus.ACTIVE) return false;
        return !isExpired();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public DataRoomStatus getStatus() {
        return status;
    }

    public void setStatus(DataRoomStatus status) {
        this.status = status;
    }

    public boolean isWatermarkEnabled() {
        return watermarkEnabled;
    }

    public void setWatermarkEnabled(boolean watermarkEnabled) {
        this.watermarkEnabled = watermarkEnabled;
    }

    public String getWatermarkPattern() {
        return watermarkPattern;
    }

    public void setWatermarkPattern(String watermarkPattern) {
        this.watermarkPattern = watermarkPattern;
    }

    public boolean isAllowDownload() {
        return allowDownload;
    }

    public void setAllowDownload(boolean allowDownload) {
        this.allowDownload = allowDownload;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
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
