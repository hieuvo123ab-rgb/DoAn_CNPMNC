package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "manual_task_activities", indexes = {
    @Index(name = "idx_task_activities_task_id", columnList = "task_id"),
    @Index(name = "idx_task_activities_created_at", columnList = "created_at")
})
public class ManualTaskActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "user_full_name", length = 100)
    private String userFullName;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "old_value", length = 255)
    private String oldValue;

    @Column(name = "new_value", length = 255)
    private String newValue;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ManualTaskActivity() {
    }

    public ManualTaskActivity(Long taskId, String username, String userFullName,
                              String action, String oldValue, String newValue, String comment) {
        this.taskId = taskId;
        this.username = username;
        this.userFullName = userFullName;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
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
