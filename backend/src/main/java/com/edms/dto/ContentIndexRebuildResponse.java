package com.edms.dto;

public class ContentIndexRebuildResponse {
    private int total;
    private int processed;
    private int ready;
    private int failed;
    private int unsupported;
    private int skipped;

    public ContentIndexRebuildResponse() {
    }

    public ContentIndexRebuildResponse(int total, int processed, int ready, int failed, int unsupported, int skipped) {
        this.total = total;
        this.processed = processed;
        this.ready = ready;
        this.failed = failed;
        this.unsupported = unsupported;
        this.skipped = skipped;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getProcessed() {
        return processed;
    }

    public void setProcessed(int processed) {
        this.processed = processed;
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

    public int getUnsupported() {
        return unsupported;
    }

    public void setUnsupported(int unsupported) {
        this.unsupported = unsupported;
    }

    public int getSkipped() {
        return skipped;
    }

    public void setSkipped(int skipped) {
        this.skipped = skipped;
    }
}
