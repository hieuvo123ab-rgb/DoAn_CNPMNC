package com.edms.dto;

import com.edms.entity.InvestigationStatus;
import jakarta.validation.constraints.NotNull;

public class InvestigationStatusUpdateRequest {

    @NotNull(message = "Trạng thái mới là bắt buộc")
    private InvestigationStatus status;

    private String note;

    public InvestigationStatus getStatus() {
        return status;
    }

    public void setStatus(InvestigationStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
