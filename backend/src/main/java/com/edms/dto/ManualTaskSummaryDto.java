package com.edms.dto;

public class ManualTaskSummaryDto {

    private long total;
    private long todo;
    private long inProgress;
    private long done;
    private long cancelled;
    private long overdue;

    public ManualTaskSummaryDto() {
    }

    public ManualTaskSummaryDto(long total, long todo, long inProgress, long done, long cancelled, long overdue) {
        this.total = total;
        this.todo = todo;
        this.inProgress = inProgress;
        this.done = done;
        this.cancelled = cancelled;
        this.overdue = overdue;
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

    public long getCancelled() {
        return cancelled;
    }

    public void setCancelled(long cancelled) {
        this.cancelled = cancelled;
    }

    public long getOverdue() {
        return overdue;
    }

    public void setOverdue(long overdue) {
        this.overdue = overdue;
    }
}
