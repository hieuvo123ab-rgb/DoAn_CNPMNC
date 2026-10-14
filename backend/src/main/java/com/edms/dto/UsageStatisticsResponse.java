package com.edms.dto;

public class UsageStatisticsResponse {
    private long totalUploads;
    private long totalPreviews;
    private long totalDownloads;
    private long totalUpdates;
    private long activeUsers;

    public UsageStatisticsResponse() {}

    public UsageStatisticsResponse(long totalUploads, long totalPreviews, long totalDownloads, long totalUpdates, long activeUsers) {
        this.totalUploads = totalUploads;
        this.totalPreviews = totalPreviews;
        this.totalDownloads = totalDownloads;
        this.totalUpdates = totalUpdates;
        this.activeUsers = activeUsers;
    }

    public long getTotalUploads() {
        return totalUploads;
    }

    public void setTotalUploads(long totalUploads) {
        this.totalUploads = totalUploads;
    }

    public long getTotalPreviews() {
        return totalPreviews;
    }

    public void setTotalPreviews(long totalPreviews) {
        this.totalPreviews = totalPreviews;
    }

    public long getTotalDownloads() {
        return totalDownloads;
    }

    public void setTotalDownloads(long totalDownloads) {
        this.totalDownloads = totalDownloads;
    }

    public long getTotalUpdates() {
        return totalUpdates;
    }

    public void setTotalUpdates(long totalUpdates) {
        this.totalUpdates = totalUpdates;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }
}
