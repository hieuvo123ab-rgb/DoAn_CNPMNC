package com.edms.dto;

public class LegalHoldRequest {

    private Boolean enabled;
    private String reason;

    public LegalHoldRequest() {
    }

    public LegalHoldRequest(Boolean enabled, String reason) {
        this.enabled = enabled;
        this.reason = reason;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
