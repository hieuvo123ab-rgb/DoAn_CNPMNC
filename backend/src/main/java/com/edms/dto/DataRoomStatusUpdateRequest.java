package com.edms.dto;

import com.edms.entity.DataRoomStatus;
import jakarta.validation.constraints.NotNull;

public class DataRoomStatusUpdateRequest {

    @NotNull(message = "Trạng thái mới không được để trống")
    private DataRoomStatus status;

    private String note;

    public DataRoomStatus getStatus() {
        return status;
    }

    public void setStatus(DataRoomStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
