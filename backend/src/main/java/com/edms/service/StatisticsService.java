package com.edms.service;

import com.edms.dto.AuditResponse;
import com.edms.dto.DashboardResponse;
import com.edms.dto.DocumentStatisticsResponse;
import com.edms.dto.UsageStatisticsResponse;
import com.edms.repository.DocumentRepository;
import com.edms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class StatisticsService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Autowired
    public StatisticsService(DocumentRepository documentRepository,
                             UserRepository userRepository,
                             AuditService auditService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public DocumentStatisticsResponse getDocumentStatistics() {
        long totalDocuments = documentRepository.count();
        long totalStorageBytes = documentRepository.sumFileSize();

        List<Object[]> rows = documentRepository.countByDocumentTypeGroup();
        Map<String, Long> byType = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String docType = (row[0] != null) ? row[0].toString() : "Chưa phân loại";
            Long count = (row[1] != null) ? ((Number) row[1]).longValue() : 0L;
            byType.put(docType, count);
        }

        return new DocumentStatisticsResponse(totalDocuments, byType, totalStorageBytes);
    }

    public UsageStatisticsResponse getUsageStatistics() {
        long totalUploads = auditService.countByAction("DOCUMENT_UPLOAD");
        long totalPreviews = auditService.countByAction("DOCUMENT_PREVIEW");
        long totalDownloads = auditService.countByAction("DOCUMENT_DOWNLOAD");
        long totalUpdates = auditService.countByAction("DOCUMENT_UPDATE");
        long activeUsers = auditService.countDistinctActiveUsers();

        return new UsageStatisticsResponse(totalUploads, totalPreviews, totalDownloads, totalUpdates, activeUsers);
    }

    public DashboardResponse getDashboard() {
        DocumentStatisticsResponse docStats = getDocumentStatistics();
        UsageStatisticsResponse usageStats = getUsageStatistics();
        long totalUsers = userRepository.count();
        List<AuditResponse> recentActivities = auditService.getRecentActivities(10)
                .stream()
                .map(AuditResponse::new)
                .toList();

        return new DashboardResponse(docStats, usageStats, totalUsers, recentActivities);
    }
}
