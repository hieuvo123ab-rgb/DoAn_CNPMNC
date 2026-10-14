package com.edms.controller;

import com.edms.dto.*;
import com.edms.entity.AuditLog;
import com.edms.service.AuditService;
import com.edms.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMonitoringController {

    private final StatisticsService statisticsService;
    private final AuditService auditService;

    @Autowired
    public AdminMonitoringController(StatisticsService statisticsService, AuditService auditService) {
        this.statisticsService = statisticsService;
        this.auditService = auditService;
    }

    /**
     * US-16: View Dashboard (5 SP)
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(statisticsService.getDashboard());
    }

    /**
     * US-17: View Document Statistics (3 SP)
     */
    @GetMapping("/statistics/documents")
    public ResponseEntity<DocumentStatisticsResponse> getDocumentStatistics() {
        return ResponseEntity.ok(statisticsService.getDocumentStatistics());
    }

    /**
     * US-18: View Usage Statistics (3 SP)
     */
    @GetMapping("/statistics/usage")
    public ResponseEntity<UsageStatisticsResponse> getUsageStatistics() {
        return ResponseEntity.ok(statisticsService.getUsageStatistics());
    }

    /**
     * US-19: View Activity History (3 SP)
     */
    @GetMapping("/activity")
    public ResponseEntity<List<AuditResponse>> getActivityHistory(
            @RequestParam(defaultValue = "20") int limit) {
        List<AuditResponse> activities = auditService.getRecentActivities(limit)
                .stream()
                .map(AuditResponse::new)
                .toList();
        return ResponseEntity.ok(activities);
    }

    /**
     * US-20: View Audit Log (3 SP)
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<AuditLog> auditPage = auditService.getAuditLogs(username, action, resourceType, page, size);
        List<AuditResponse> content = auditPage.getContent().stream().map(AuditResponse::new).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("currentPage", auditPage.getNumber());
        response.put("totalElements", auditPage.getTotalElements());
        response.put("totalPages", auditPage.getTotalPages());
        response.put("pageSize", auditPage.getSize());

        return ResponseEntity.ok(response);
    }
}
