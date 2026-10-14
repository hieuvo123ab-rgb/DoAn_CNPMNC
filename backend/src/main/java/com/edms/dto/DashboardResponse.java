package com.edms.dto;

import java.util.List;

public class DashboardResponse {
    private DocumentStatisticsResponse documentStats;
    private UsageStatisticsResponse usageStats;
    private long totalUsers;
    private List<AuditResponse> recentActivities;

    public DashboardResponse() {}

    public DashboardResponse(DocumentStatisticsResponse documentStats, UsageStatisticsResponse usageStats, long totalUsers, List<AuditResponse> recentActivities) {
        this.documentStats = documentStats;
        this.usageStats = usageStats;
        this.totalUsers = totalUsers;
        this.recentActivities = recentActivities;
    }

    public DocumentStatisticsResponse getDocumentStats() {
        return documentStats;
    }

    public void setDocumentStats(DocumentStatisticsResponse documentStats) {
        this.documentStats = documentStats;
    }

    public UsageStatisticsResponse getUsageStats() {
        return usageStats;
    }

    public void setUsageStats(UsageStatisticsResponse usageStats) {
        this.usageStats = usageStats;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public List<AuditResponse> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<AuditResponse> recentActivities) {
        this.recentActivities = recentActivities;
    }
}
