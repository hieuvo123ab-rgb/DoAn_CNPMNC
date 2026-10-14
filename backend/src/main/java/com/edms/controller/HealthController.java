package com.edms.controller;

import com.edms.service.LocalEmbeddingService;
import com.edms.service.OperationalDiagnosticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Phase 16: Health, Liveness & Readiness Controller.
 *
 * Provides:
 * - GET /api/health: Full backward compatibility for existing monitors/tests.
 * - GET /api/health/liveness: Lightweight probe answering "Is backend process alive?".
 * - GET /api/health/readiness: Evaluates critical dependencies (DB, Storage, Signing)
 *   returning 200 OK when READY/DEGRADED and 503 SERVICE_UNAVAILABLE when NOT_READY.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final LocalEmbeddingService localEmbeddingService;
    private final OperationalDiagnosticsService diagnosticsService;

    public HealthController(LocalEmbeddingService localEmbeddingService,
                            OperationalDiagnosticsService diagnosticsService) {
        this.localEmbeddingService = localEmbeddingService;
        this.diagnosticsService = diagnosticsService;
    }

    /**
     * Backward-compatible health endpoint preserved from previous phases.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "EDMS Backend");
        status.put("version", "1.0.0-sprint1");
        status.put("timestamp", Instant.now().toString());
        // Phase 12: Semantic model availability
        status.put("semanticModel", localEmbeddingService.isAvailable() ? "AVAILABLE" : "UNAVAILABLE");
        status.put("semanticModelId", localEmbeddingService.getModelId());
        return ResponseEntity.ok(status);
    }

    /**
     * Liveness probe: Returns UP as long as the JVM application process is alive and responding.
     */
    @GetMapping("/liveness")
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> live = new HashMap<>();
        live.put("status", "UP");
        live.put("timestamp", Instant.now().toString());
        live.put("uptimeSeconds", diagnosticsService.getUptimeSeconds());
        return ResponseEntity.ok(live);
    }

    /**
     * Readiness probe: Evaluates critical infrastructure dependencies.
     * Returns HTTP 200 when READY or DEGRADED; returns HTTP 503 when NOT_READY.
     */
    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness(
            @RequestHeader(value = "X-Test-Simulate-Failure", required = false) String simulateFailure) {
        Map<String, Object> readiness = diagnosticsService.getReadiness(simulateFailure);
        String state = String.valueOf(readiness.get("readiness"));

        if ("NOT_READY".equalsIgnoreCase(state)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(readiness);
        }
        return ResponseEntity.ok(readiness);
    }
}
