package com.edms.dto;

import com.edms.entity.InvestigationReason;
import com.edms.entity.InvestigationSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class InvestigationCaseCreateRequest {

    @NotBlank(message = "Tiêu đề hồ sơ điều tra không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    private String description;

    @NotNull(message = "Lý do điều tra là bắt buộc")
    private InvestigationReason reason = InvestigationReason.OTHER;

    @NotNull(message = "Mức độ nghiêm trọng là bắt buộc")
    private InvestigationSeverity severity = InvestigationSeverity.MEDIUM;

    @NotBlank(message = "Người phụ trách là bắt buộc")
    private String assignedTo;

    private Instant dueDate;

    private Long targetDocumentId;

    private Long vdrEventId;

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

    public InvestigationReason getReason() {
        return reason;
    }

    public void setReason(InvestigationReason reason) {
        this.reason = reason;
    }

    public InvestigationSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(InvestigationSeverity severity) {
        this.severity = severity;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Long getTargetDocumentId() {
        return targetDocumentId;
    }

    public void setTargetDocumentId(Long targetDocumentId) {
        this.targetDocumentId = targetDocumentId;
    }

    public Long getVdrEventId() {
        return vdrEventId;
    }

    public void setVdrEventId(Long vdrEventId) {
        this.vdrEventId = vdrEventId;
    }
}
