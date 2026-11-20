package com.edms.dto;

import jakarta.validation.constraints.NotNull;

public class InvestigationEvidencePreserveRequest {

    @NotNull(message = "Mã tài liệu là bắt buộc")
    private Long documentId;

    @NotNull(message = "Số phiên bản là bắt buộc")
    private Integer versionNumber;

    private String notes;

    private boolean applyLegalHold = true;

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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isApplyLegalHold() {
        return applyLegalHold;
    }

    public void setApplyLegalHold(boolean applyLegalHold) {
        this.applyLegalHold = applyLegalHold;
    }
}
