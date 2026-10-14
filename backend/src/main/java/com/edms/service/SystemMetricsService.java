package com.edms.service;

import com.edms.entity.DispositionStatus;
import com.edms.entity.ReviewStatus;
import com.edms.repository.DocumentDispositionRepository;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentReviewRepository;
import com.edms.repository.DocumentVersionRepository;
import com.edms.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Phase 16: Safe Operational Metrics Service.
 *
 * Collects aggregated runtime performance, memory usage, request counts,
 * and high-level business entity counts without exposing sensitive credentials
 * or unbounded high-cardinality labels (no usernames, document IDs, or queries).
 */
@Service
public class SystemMetricsService {

    private final Instant startTime = Instant.now();
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalDurationMs = new AtomicLong(0);

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentReviewRepository documentReviewRepository;
    private final DocumentDispositionRepository documentDispositionRepository;
    private final NotificationRepository notificationRepository;

    public SystemMetricsService(DocumentRepository documentRepository,
                                DocumentVersionRepository documentVersionRepository,
                                DocumentReviewRepository documentReviewRepository,
                                DocumentDispositionRepository documentDispositionRepository,
                                NotificationRepository notificationRepository) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentReviewRepository = documentReviewRepository;
        this.documentDispositionRepository = documentDispositionRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Records a completed HTTP request for metrics tracking.
     */
    public void recordRequest(long durationMs) {
        totalRequests.incrementAndGet();
        totalDurationMs.addAndGet(Math.max(0, durationMs));
    }

    public long getTotalRequests() {
        return totalRequests.get();
    }

    public double getAverageResponseTimeMs() {
        long count = totalRequests.get();
        if (count == 0) {
            return 0.0;
        }
        return Math.round(((double) totalDurationMs.get() / count) * 100.0) / 100.0;
    }

    /**
     * Builds safe, sanitized admin metrics summary.
     */
    public Map<String, Object> getMetricsSummary() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemoryMb = runtime.totalMemory() / (1024 * 1024);
        long freeMemoryMb = runtime.freeMemory() / (1024 * 1024);
        long usedMemoryMb = totalMemoryMb - freeMemoryMb;
        long maxMemoryMb = runtime.maxMemory() / (1024 * 1024);

        long uptime = Duration.between(startTime, Instant.now()).getSeconds();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("uptimeSeconds", uptime);
        metrics.put("timestamp", Instant.now().toString());

        Map<String, Object> memory = new LinkedHashMap<>();
        memory.put("usedMb", usedMemoryMb);
        memory.put("totalMb", totalMemoryMb);
        memory.put("maxMb", maxMemoryMb);
        metrics.put("memory", memory);

        Map<String, Object> requests = new LinkedHashMap<>();
        requests.put("totalCount", totalRequests.get());
        requests.put("averageResponseTimeMs", getAverageResponseTimeMs());
        metrics.put("requests", requests);

        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("documents", documentRepository.count());
        counts.put("versions", documentVersionRepository.count());
        counts.put("pendingReviews", documentReviewRepository.countByStatus(ReviewStatus.PENDING));
        counts.put("pendingDispositions", documentDispositionRepository.countByStatus(DispositionStatus.PENDING));
        counts.put("unreadNotifications", notificationRepository.countByReadFalse());
        metrics.put("businessCounts", counts);
        metrics.put("counts", counts);

        return metrics;
    }
}
