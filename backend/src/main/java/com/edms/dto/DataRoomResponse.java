package com.edms.dto;

import com.edms.entity.DataRoomRole;
import com.edms.entity.DataRoomStatus;

import java.time.Instant;

public class DataRoomResponse {

    private Long id;
    private String roomCode;
    private String name;
    private String purpose;
    private String description;
    private String ownerUsername;
    private DataRoomStatus status;
    private boolean watermarkEnabled;
    private String watermarkPattern;
    private boolean allowDownload;
    private Instant startDate;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean expired;
    private boolean accessible;
    private int documentCount;
    private int memberCount;
    private DataRoomRole currentUserRole;
    private boolean currentUserCanDownload;

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

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
    }

    public boolean isAccessible() {
        return accessible;
    }

    public void setAccessible(boolean accessible) {
        this.accessible = accessible;
    }

    public int getDocumentCount() {
        return documentCount;
    }

    public void setDocumentCount(int documentCount) {
        this.documentCount = documentCount;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }

    public DataRoomRole getCurrentUserRole() {
        return currentUserRole;
    }

    public void setCurrentUserRole(DataRoomRole currentUserRole) {
        this.currentUserRole = currentUserRole;
    }

    public boolean isCurrentUserCanDownload() {
        return currentUserCanDownload;
    }

    public void setCurrentUserCanDownload(boolean currentUserCanDownload) {
        this.currentUserCanDownload = currentUserCanDownload;
    }
}
