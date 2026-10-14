package com.edms.dto;

import jakarta.validation.constraints.NotNull;

public class ShareDocumentRequest {

    private Long userId;
    private String username;

    @NotNull(message = "Quyền hạn không được để trống")
    private String permission; // "READ" or "EDIT"

    public ShareDocumentRequest() {
    }

    public ShareDocumentRequest(Long userId, String permission) {
        this.userId = userId;
        this.permission = permission;
    }

    public ShareDocumentRequest(String username, String permission) {
        this.username = username;
        this.permission = permission;
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

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }
}
