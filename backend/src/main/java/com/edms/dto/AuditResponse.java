package com.edms.dto;

import com.edms.entity.AuditLog;
import java.time.Instant;

public class AuditResponse {
    private Long id;
    private String username;
    private String action;
    private String resourceType;
    private String resourceId;
    private String description;
    private Instant timestamp;
    private String ipAddress;

    public AuditResponse() {}

    public AuditResponse(AuditLog log) {
        this.id = log.getId();
        this.username = log.getUsername();
        this.action = log.getAction();
        this.resourceType = log.getResourceType();
        this.resourceId = log.getResourceId();
        this.description = log.getDescription();
        this.timestamp = log.getTimestamp();
        this.ipAddress = log.getIpAddress();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
