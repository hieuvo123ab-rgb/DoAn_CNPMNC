package com.edms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DocumentUpdateRequest {

    @NotBlank(message = "Tiêu đề tài liệu không được để trống")
    @Size(max = 255, message = "Tiêu đề tài liệu không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String description;

    @NotBlank(message = "Loại tài liệu không được để trống")
    @Size(max = 50, message = "Loại tài liệu không được vượt quá 50 ký tự")
    private String documentType;

    private String accessMode;

    public DocumentUpdateRequest() {
    }

    public DocumentUpdateRequest(String title, String description, String documentType) {
        this.title = title;
        this.description = description;
        this.documentType = documentType;
    }

    public DocumentUpdateRequest(String title, String description, String documentType, String accessMode) {
        this.title = title;
        this.description = description;
        this.documentType = documentType;
        this.accessMode = accessMode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(String accessMode) {
        this.accessMode = accessMode;
    }
}
