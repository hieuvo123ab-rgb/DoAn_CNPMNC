package com.edms.dto;

public class DataRoomSummaryDto {

    private long totalRooms;
    private long activeRooms;
    private long draftRooms;
    private long suspendedRooms;
    private long closedRooms;
    private long totalDocuments;
    private long totalMembers;
    private long totalEvents;
    private long suspiciousEventsCount;

    public long getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(long totalRooms) {
        this.totalRooms = totalRooms;
    }

    public long getActiveRooms() {
        return activeRooms;
    }

    public void setActiveRooms(long activeRooms) {
        this.activeRooms = activeRooms;
    }

    public long getDraftRooms() {
        return draftRooms;
    }

    public void setDraftRooms(long draftRooms) {
        this.draftRooms = draftRooms;
    }

    public long getSuspendedRooms() {
        return suspendedRooms;
    }

    public void setSuspendedRooms(long suspendedRooms) {
        this.suspendedRooms = suspendedRooms;
    }

    public long getClosedRooms() {
        return closedRooms;
    }

    public void setClosedRooms(long closedRooms) {
        this.closedRooms = closedRooms;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(long totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public long getTotalMembers() {
        return totalMembers;
    }

    public void setTotalMembers(long totalMembers) {
        this.totalMembers = totalMembers;
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getSuspiciousEventsCount() {
        return suspiciousEventsCount;
    }

    public void setSuspiciousEventsCount(long suspiciousEventsCount) {
        this.suspiciousEventsCount = suspiciousEventsCount;
    }
}
