package com.edms.dto;

import com.edms.entity.DataRoomRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DataRoomInviteRequest {

    @NotBlank(message = "Email người nhận lời mời không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotNull(message = "Vai trò là bắt buộc")
    private DataRoomRole role = DataRoomRole.ROOM_GUEST;

    private int expiresInDays = 7;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public DataRoomRole getRole() {
        return role;
    }

    public void setRole(DataRoomRole role) {
        this.role = role;
    }

    public int getExpiresInDays() {
        return expiresInDays;
    }

    public void setExpiresInDays(int expiresInDays) {
        this.expiresInDays = expiresInDays;
    }
}
