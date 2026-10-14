package com.edms.dto;

import jakarta.validation.constraints.NotBlank;

public class DocumentMetadataRequest {

    @NotBlank(message = "Document title is required")
    private String title;

    private String description;

    @NotBlank(message = "Document type is required")
    private String documentType;

    private String accessMode = "INTERNAL";

    public DocumentMetadataRequest() {
    }

    public DocumentMetadataRequest(String title, String description, String documentType) {
        this(title, description, documentType, "INTERNAL");
    }

    public DocumentMetadataRequest(String title, String description, String documentType, String accessMode) {
        this.title = title;
        this.description = description;
        this.documentType = documentType;
        this.accessMode = (accessMode != null && !accessMode.isBlank()) ? accessMode : "INTERNAL";
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
        this.accessMode = (accessMode != null && !accessMode.isBlank()) ? accessMode : "INTERNAL";
    }
}
