package com.edms.dto;

import jakarta.validation.constraints.Size;

public class DispositionDecisionDto {

    @Size(max = 1000, message = "Ý kiến phản hồi không được vượt quá 1000 ký tự")
    private String comment;

    public DispositionDecisionDto() {
    }

    public DispositionDecisionDto(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
