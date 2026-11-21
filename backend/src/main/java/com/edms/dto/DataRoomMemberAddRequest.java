package com.edms.dto;

import com.edms.entity.DataRoomRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DataRoomMemberAddRequest {

    private String username;

    @NotBlank(message = "Email thành viên không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String fullName;

    @NotNull(message = "Vai trò thành viên là bắt buộc")
    private DataRoomRole role = DataRoomRole.ROOM_VIEWER;

    private boolean canDownload = false;

    private boolean canViewMetadata = true;

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
}
