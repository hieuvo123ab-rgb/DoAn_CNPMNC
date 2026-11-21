package com.edms.dto;

import java.time.Instant;

public class ManualTaskActivityResponse {

    private Long id;
    private Long taskId;
    private String username;
    private String userFullName;
    private String action;
    private String oldValue;
    private String newValue;
    private String comment;
    private Instant createdAt;

    public ManualTaskActivityResponse() {
    }

    public ManualTaskActivityResponse(Long id, Long taskId, String username, String userFullName,
                                      String action, String oldValue, String newValue,
                                      String comment, Instant createdAt) {
        this.id = id;
        this.taskId = taskId;
        this.username = username;
        this.userFullName = userFullName;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
