package com.edms.dto;

import com.edms.entity.ManualTaskPriority;
import com.edms.entity.ManualTaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class ManualTaskUpdateRequest {

    @NotBlank(message = "Tiêu đề công việc không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 4000, message = "Mô tả không được vượt quá 4000 ký tự")
    private String description;

    @NotBlank(message = "Người phụ trách không được để trống")
    @Size(max = 50, message = "Tên tài khoản người phụ trách không hợp lệ")
    private String assignee;

    private ManualTaskPriority priority;

    private ManualTaskStatus status;

    private Instant dueDate;

    private Long documentId;

    private String notes;

    public ManualTaskUpdateRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public ManualTaskPriority getPriority() {
        return priority;
    }

    public void setPriority(ManualTaskPriority priority) {
        this.priority = priority;
    }

    public ManualTaskStatus getStatus() {
        return status;
    }

    public void setStatus(ManualTaskStatus status) {
        this.status = status;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
