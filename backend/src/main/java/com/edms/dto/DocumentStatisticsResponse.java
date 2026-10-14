package com.edms.dto;

import java.util.Map;

public class DocumentStatisticsResponse {
    private long totalDocuments;
    private Map<String, Long> documentsByType;
    private long totalStorageBytes;

    public DocumentStatisticsResponse() {}

    public DocumentStatisticsResponse(long totalDocuments, Map<String, Long> documentsByType, long totalStorageBytes) {
        this.totalDocuments = totalDocuments;
        this.documentsByType = documentsByType;
        this.totalStorageBytes = totalStorageBytes;
    }

    public long getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(long totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public Map<String, Long> getDocumentsByType() {
        return documentsByType;
    }

    public void setDocumentsByType(Map<String, Long> documentsByType) {
        this.documentsByType = documentsByType;
    }

    public long getTotalStorageBytes() {
        return totalStorageBytes;
    }

    public void setTotalStorageBytes(long totalStorageBytes) {
        this.totalStorageBytes = totalStorageBytes;
    }
}
