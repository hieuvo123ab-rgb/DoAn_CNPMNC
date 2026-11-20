package com.edms.dto;

public class ManualTaskWorkloadDto {

    private String username;
    private String fullName;
    private long total;
    private long todo;
    private long inProgress;
    private long done;
    private long overdue;

    public ManualTaskWorkloadDto() {
    }

    public ManualTaskWorkloadDto(String username, String fullName, long total, long todo, long inProgress, long done, long overdue) {
        this.username = username;
        this.fullName = fullName;
        this.total = total;
        this.todo = todo;
        this.inProgress = inProgress;
        this.done = done;
        this.overdue = overdue;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getTodo() {
        return todo;
    }

    public void setTodo(long todo) {
        this.todo = todo;
    }

    public long getInProgress() {
        return inProgress;
    }

    public void setInProgress(long inProgress) {
        this.inProgress = inProgress;
    }

    public long getDone() {
        return done;
    }

    public void setDone(long done) {
        this.done = done;
    }

    public long getOverdue() {
        return overdue;
    }

    public void setOverdue(long overdue) {
        this.overdue = overdue;
    }
}
