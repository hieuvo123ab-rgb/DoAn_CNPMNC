package com.edms.dto;

import jakarta.validation.constraints.NotNull;

public class DataRoomDocumentAddRequest {

    @NotNull(message = "Mã tài liệu là bắt buộc")
    private Long documentId;

    private Integer versionNumber;

    private String folderPath = "/";

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getFolderPath() {
        return folderPath;
    }

    public void setFolderPath(String folderPath) {
        this.folderPath = folderPath;
    }
}
