package com.edms.dto;

public class InvestigationSummaryDto {

    private long total;
    private long open;
    private long investigating;
    private long reviewPending;
    private long closed;
    private long reopened;
    private long critical;
    private long overdue;

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getOpen() {
        return open;
    }

    public void setOpen(long open) {
        this.open = open;
    }

    public long getInvestigating() {
        return investigating;
    }

    public void setInvestigating(long investigating) {
        this.investigating = investigating;
    }

    public long getReviewPending() {
        return reviewPending;
    }

    public void setReviewPending(long reviewPending) {
        this.reviewPending = reviewPending;
    }

    public long getClosed() {
        return closed;
    }

    public void setClosed(long closed) {
        this.closed = closed;
    }

    public long getReopened() {
        return reopened;
    }

    public void setReopened(long reopened) {
        this.reopened = reopened;
    }

    public long getCritical() {
        return critical;
    }

    public void setCritical(long critical) {
        this.critical = critical;
    }

    public long getOverdue() {
        return overdue;
    }

    public void setOverdue(long overdue) {
        this.overdue = overdue;
    }
}
