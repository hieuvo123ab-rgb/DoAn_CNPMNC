package com.edms.dto;

import jakarta.validation.constraints.NotBlank;

public class AccessModeUpdateRequest {

    @NotBlank(message = "Chế độ truy cập không được để trống")
    private String accessMode; // "INTERNAL" or "PRIVATE"

    public AccessModeUpdateRequest() {
    }

    public AccessModeUpdateRequest(String accessMode) {
        this.accessMode = accessMode;
    }

    public String getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(String accessMode) {
        this.accessMode = accessMode;
    }
}
