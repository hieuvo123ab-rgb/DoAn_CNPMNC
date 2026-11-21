package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vdr_members", indexes = {
    @Index(name = "idx_vdrmem_room_id", columnList = "room_id"),
    @Index(name = "idx_vdrmem_username", columnList = "username"),
    @Index(name = "idx_vdrmem_email", columnList = "email")
})
public class DataRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DataRoomRole role = DataRoomRole.ROOM_GUEST;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DataRoomMemberStatus status = DataRoomMemberStatus.ACTIVE;

    @Column(name = "can_download", nullable = false)
    private boolean canDownload = false;

    @Column(name = "can_view_metadata", nullable = false)
    private boolean canViewMetadata = true;

    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by", length = 50)
    private String revokedBy;

    @Column(name = "revoke_reason", length = 255)
    private String revokeReason;

    public DataRoomMember() {
    }

    @PrePersist
    public void prePersist() {
        if (this.invitedAt == null) {
            this.invitedAt = Instant.now();
        }
    }

    public boolean isActive() {
        return this.status == DataRoomMemberStatus.ACTIVE;
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
