package com.edms.dto;

import java.util.List;

public class DocumentPermissionsResponse {

    private Long documentId;
    private String documentTitle;
    private String accessMode;
    private String owner;
    private List<DocumentPermissionItemResponse> permissions;

    public DocumentPermissionsResponse() {
    }

    public DocumentPermissionsResponse(Long documentId, String documentTitle, String accessMode, String owner, List<DocumentPermissionItemResponse> permissions) {
        this.documentId = documentId;
        this.documentTitle = documentTitle;
        this.accessMode = accessMode;
        this.owner = owner;
        this.permissions = permissions;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getDocumentTitle() {
        return documentTitle;
    }

    public void setDocumentTitle(String documentTitle) {
        this.documentTitle = documentTitle;
    }

    public String getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(String accessMode) {
        this.accessMode = accessMode;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public List<DocumentPermissionItemResponse> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<DocumentPermissionItemResponse> permissions) {
        this.permissions = permissions;
    }
}
