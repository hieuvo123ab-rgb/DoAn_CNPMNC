package com.edms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class DataRoomUpdateRequest {

    @NotBlank(message = "Tên phòng dữ liệu không được để trống")
    @Size(max = 255, message = "Tên phòng không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 255, message = "Mục đích không được vượt quá 255 ký tự")
    private String purpose;

    private String description;

    private boolean watermarkEnabled;

    private String watermarkPattern;

    private boolean allowDownload;

    private Instant expiresAt;

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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
