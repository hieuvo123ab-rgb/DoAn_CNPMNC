package com.edms.dto;

public class OcrIndexRebuildResponse {

    private int total;
    private int eligible;
    private int queued;
    private int ready;
    private int failed;
    private int skipped;

    public OcrIndexRebuildResponse() {
    }

    public OcrIndexRebuildResponse(int total, int eligible, int queued, int ready, int failed, int skipped) {
        this.total = total;
        this.eligible = eligible;
        this.queued = queued;
        this.ready = ready;
        this.failed = failed;
        this.skipped = skipped;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getEligible() {
        return eligible;
    }

    public void setEligible(int eligible) {
        this.eligible = eligible;
    }

    public int getQueued() {
        return queued;
    }

    public void setQueued(int queued) {
        this.queued = queued;
    }

    public int getReady() {
        return ready;
    }

    public void setReady(int ready) {
        this.ready = ready;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public int getSkipped() {
        return skipped;
    }

    public void setSkipped(int skipped) {
        this.skipped = skipped;
    }
}
