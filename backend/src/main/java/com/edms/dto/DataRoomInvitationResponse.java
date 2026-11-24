package com.edms.dto;

import com.edms.entity.DataRoomInvitationStatus;
import com.edms.entity.DataRoomRole;

import java.time.Instant;

public class DataRoomInvitationResponse {

    private Long id;
    private Long roomId;
    private String roomName;
    private String email;
    private String token;
    private DataRoomRole role;
    private DataRoomInvitationStatus status;
    private Instant expiresAt;
    private String createdBy;
    private Instant createdAt;
    private Instant acceptedAt;
    private boolean expired;
    private boolean valid;

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

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public DataRoomRole getRole() {
        return role;
    }

    public void setRole(DataRoomRole role) {
        this.role = role;
    }

    public DataRoomInvitationStatus getStatus() {
        return status;
    }

    public void setStatus(DataRoomInvitationStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }
}
