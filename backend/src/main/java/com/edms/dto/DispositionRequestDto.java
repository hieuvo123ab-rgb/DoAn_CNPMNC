package com.edms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DispositionRequestDto {

    @NotBlank(message = "Lý do yêu cầu tiêu hủy là bắt buộc")
    @Size(max = 1000, message = "Lý do không được vượt quá 1000 ký tự")
    private String reason;

    public DispositionRequestDto() {
    }

    public DispositionRequestDto(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
