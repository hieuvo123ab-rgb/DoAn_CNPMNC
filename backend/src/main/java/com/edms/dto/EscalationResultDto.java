package com.edms.dto;

public class EscalationResultDto {

    private int remindedTasksCount;
    private int overdueTasksCount;
    private String message;

    public EscalationResultDto() {
    }

    public EscalationResultDto(int remindedTasksCount, int overdueTasksCount, String message) {
        this.remindedTasksCount = remindedTasksCount;
        this.overdueTasksCount = overdueTasksCount;
        this.message = message;
    }

    public int getRemindedTasksCount() {
        return remindedTasksCount;
    }

    public void setRemindedTasksCount(int remindedTasksCount) {
        this.remindedTasksCount = remindedTasksCount;
    }

    public int getOverdueTasksCount() {
        return overdueTasksCount;
    }

    public void setOverdueTasksCount(int overdueTasksCount) {
        this.overdueTasksCount = overdueTasksCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
