package com.edms.dto;

public class RetentionUpdateRequest {

    private String retentionUntil;

    public RetentionUpdateRequest() {
    }

    public RetentionUpdateRequest(String retentionUntil) {
        this.retentionUntil = retentionUntil;
    }

    public String getRetentionUntil() {
        return retentionUntil;
    }

    public void setRetentionUntil(String retentionUntil) {
        this.retentionUntil = retentionUntil;
    }
}
