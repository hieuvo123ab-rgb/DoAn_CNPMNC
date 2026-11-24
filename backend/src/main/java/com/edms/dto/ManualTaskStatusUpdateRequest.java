package com.edms.dto;

import com.edms.entity.ManualTaskStatus;
import jakarta.validation.constraints.NotNull;

public class ManualTaskStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private ManualTaskStatus status;

    private String note;

    public ManualTaskStatusUpdateRequest() {
    }

    public ManualTaskStatus getStatus() {
        return status;
    }

    public void setStatus(ManualTaskStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
