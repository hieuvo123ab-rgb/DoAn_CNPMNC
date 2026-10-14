package com.edms.security;

import com.edms.exception.LoginRateLimitedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phase 17: In-memory Rate Limiting for Sensitive/Expensive Endpoints.
 *
 * Protects expensive administrative and cryptographic operations:
 * - OCR index rebuild
 * - Semantic index rebuild
 * - Integrity verify all
 * - Digital signing
 *
 * Employs a sliding-window token bucket with bounded key storage.
 */
@Service
public class ApiRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(ApiRateLimiterService.class);
    private static final int MAX_TRACKED_KEYS = 5000;

    private static class EndpointBucket {
        private int count;
        private Instant windowStart;

        public EndpointBucket() {
            this.count = 1;
            this.windowStart = Instant.now();
        }

        public synchronized boolean tryAcquire(int maxLimit, long windowSeconds) {
            Instant now = Instant.now();
            if (now.isAfter(windowStart.plusSeconds(windowSeconds))) {
                this.windowStart = now;
                this.count = 1;
                return true;
            }
            if (this.count < maxLimit) {
                this.count++;
                return true;
            }
            return false;
        }

        public synchronized long getRemainingWindowSeconds(long windowSeconds) {
            long elapsed = Instant.now().getEpochSecond() - windowStart.getEpochSecond();
            return Math.max(1, windowSeconds - elapsed);
        }

        public synchronized boolean isExpired(long windowSeconds) {
            return Instant.now().isAfter(windowStart.plusSeconds(windowSeconds * 2));
        }
    }

    private final Map<String, EndpointBucket> bucketMap = new ConcurrentHashMap<>();

    public void checkLimit(String operationKey, String userOrIp, int maxRequests, long windowSeconds) {
        if (bucketMap.size() >= MAX_TRACKED_KEYS) {
            bucketMap.entrySet().removeIf(e -> e.getValue().isExpired(windowSeconds));
        }

        String key = operationKey + ":" + (userOrIp != null ? userOrIp.toLowerCase() : "anonymous");
        EndpointBucket bucket = bucketMap.computeIfAbsent(key, k -> new EndpointBucket());

        if (!bucket.tryAcquire(maxRequests, windowSeconds)) {
            long retryAfter = bucket.getRemainingWindowSeconds(windowSeconds);
            log.warn("Rate limit exceeded for {} by {}: max {} in {}s, retry after {}s",
                    operationKey, userOrIp, maxRequests, windowSeconds, retryAfter);
            throw new LoginRateLimitedException("Quá nhiều yêu cầu cho tác vụ " + operationKey + ". Vui lòng thử lại sau.", retryAfter);
        }
    }

    public void clear(String operationKey, String userOrIp) {
        bucketMap.remove(operationKey + ":" + (userOrIp != null ? userOrIp.toLowerCase() : "anonymous"));
    }

    public void clearAll() {
        bucketMap.clear();
    }

    public int getTrackedKeyCount() {
        return bucketMap.size();
    }
}
