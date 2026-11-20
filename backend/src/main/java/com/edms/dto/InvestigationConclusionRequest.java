package com.edms.dto;

import jakarta.validation.constraints.NotBlank;

public class InvestigationConclusionRequest {

    @NotBlank(message = "Kết luận điều tra không được để trống")
    private String conclusion;

    public String getConclusion() {
        return conclusion;
    }

    public void setConclusion(String conclusion) {
        this.conclusion = conclusion;
    }
}
