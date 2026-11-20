package com.edms.dto;

import com.edms.entity.DataRoomMemberStatus;
import com.edms.entity.DataRoomRole;

import java.time.Instant;

public class DataRoomMemberResponse {

    private Long id;
    private Long roomId;
    private String username;
    private String email;
    private String fullName;
    private DataRoomRole role;
    private DataRoomMemberStatus status;
    private boolean canDownload;
    private boolean canViewMetadata;
    private Instant invitedAt;
    private Instant joinedAt;
    private Instant revokedAt;
    private String revokedBy;
    private String revokeReason;

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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public DataRoomRole getRole() {
        return role;
    }

    public void setRole(DataRoomRole role) {
        this.role = role;
    }

    public DataRoomMemberStatus getStatus() {
        return status;
    }

    public void setStatus(DataRoomMemberStatus status) {
        this.status = status;
    }

    public boolean isCanDownload() {
        return canDownload;
    }

    public void setCanDownload(boolean canDownload) {
        this.canDownload = canDownload;
    }

    public boolean isCanViewMetadata() {
        return canViewMetadata;
    }

    public void setCanViewMetadata(boolean canViewMetadata) {
        this.canViewMetadata = canViewMetadata;
    }

    public Instant getInvitedAt() {
        return invitedAt;
    }

    public void setInvitedAt(Instant invitedAt) {
        this.invitedAt = invitedAt;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public String getRevokeReason() {
        return revokeReason;
    }

    public void setRevokeReason(String revokeReason) {
        this.revokeReason = revokeReason;
    }
}
