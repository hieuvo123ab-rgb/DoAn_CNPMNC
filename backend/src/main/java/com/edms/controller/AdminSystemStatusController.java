package com.edms.controller;

import com.edms.service.OperationalDiagnosticsService;
import com.edms.service.SystemMetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 16: Admin System Status & Operational Metrics Controller.
 *
 * Exposes detailed diagnostic health state and system metrics strictly to ROLE_ADMIN.
 * Prevents any credential leakage or exposure of private keys/passwords.
 */
@RestController
@RequestMapping("/api/admin/system")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemStatusController {

    private final OperationalDiagnosticsService diagnosticsService;
    private final SystemMetricsService metricsService;

    public AdminSystemStatusController(OperationalDiagnosticsService diagnosticsService,
                                       SystemMetricsService metricsService) {
        this.diagnosticsService = diagnosticsService;
        this.metricsService = metricsService;
    }

    /**
     * Comprehensive system diagnostic status for operators and administrators.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus(
            @RequestHeader(value = "X-Test-Simulate-Failure", required = false) String simulateFailure) {
        Map<String, Object> status = diagnosticsService.getSystemStatus(simulateFailure);
        return ResponseEntity.ok(status);
    }

    /**
     * Aggregated, safe runtime metrics summary.
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Map<String, Object> metrics = metricsService.getMetricsSummary();
        return ResponseEntity.ok(metrics);
    }
}
