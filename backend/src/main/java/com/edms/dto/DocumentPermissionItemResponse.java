package com.edms.dto;

import com.edms.entity.DocumentPermission;
import java.time.Instant;

public class DocumentPermissionItemResponse {

    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String permission;
    private Instant createdAt;

    public DocumentPermissionItemResponse() {
    }

    public static DocumentPermissionItemResponse fromEntity(DocumentPermission dp) {
        DocumentPermissionItemResponse res = new DocumentPermissionItemResponse();
        res.setId(dp.getId());
        res.setUserId(dp.getUser().getId());
        res.setUsername(dp.getUser().getUsername());
        res.setFullName(dp.getUser().getFullName());
        res.setPermission(dp.getPermission().name());
        res.setCreatedAt(dp.getCreatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
