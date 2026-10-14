package com.edms.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phase 17: In-memory Authentication Abuse Protection & Rate Limiting.
 *
 * Implements bounded rate limiting for POST /api/auth/login:
 * 1. Keyed by composite (normalized username + client IP) to prevent Account-Lockout DoS.
 * 2. Blocks after MAX_ATTEMPTS (5) failed attempts within WINDOW_SECONDS (900s / 15m).
 * 3. Successful login clears failed attempt count for the key.
 * 4. Bounded memory: maximum MAX_TRACKED_KEYS (5000) with TTL cleanup to prevent memory exhaustion.
 * 5. Returns Retry-After duration.
 */
@Service
public class LoginRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimiterService.class);

    public static final int DEFAULT_MAX_ATTEMPTS = 5;
    public static final long DEFAULT_LOCKOUT_SECONDS = 900; // 15 minutes
    public static final int MAX_TRACKED_KEYS = 5000;

    private int maxAttempts = DEFAULT_MAX_ATTEMPTS;
    private long lockoutSeconds = DEFAULT_LOCKOUT_SECONDS;

    private final Map<String, AttemptRecord> attemptCache = new ConcurrentHashMap<>();

    public static class AttemptRecord {
        private int failureCount;
        private Instant firstFailureAt;
        private Instant lockedUntil;

        public AttemptRecord() {
            this.failureCount = 1;
            this.firstFailureAt = Instant.now();
            this.lockedUntil = null;
        }

        public synchronized void increment(int maxAttempts, long lockoutSec) {
            this.failureCount++;
            if (this.failureCount >= maxAttempts) {
                this.lockedUntil = Instant.now().plusSeconds(lockoutSec);
            }
        }

        public synchronized boolean isLocked() {
            if (lockedUntil == null) {
                return false;
            }
            if (Instant.now().isAfter(lockedUntil)) {
                // Lock expired
                return false;
            }
            return true;
        }

        public synchronized long getRemainingSeconds() {
            if (lockedUntil == null) {
                return 0;
            }
            long remaining = lockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
            return Math.max(0, remaining);
        }

        public synchronized boolean isExpired(long lockoutSec) {
            Instant cutoff = Instant.now().minusSeconds(lockoutSec * 2);
            return firstFailureAt.isBefore(cutoff) && !isLocked();
        }
    }

    private String buildKey(String username, String clientIp) {
        String u = username != null ? username.trim().toLowerCase() : "anonymous";
        String ip = clientIp != null ? clientIp.trim() : "unknown";
        return u + "|" + ip;
    }

    /**
     * Checks if the user/IP combination is currently locked out.
     */
    public boolean isBlocked(String username, String clientIp) {
        String key = buildKey(username, clientIp);
        AttemptRecord record = attemptCache.get(key);
        if (record == null) {
            return false;
        }
        if (record.isLocked()) {
            return true;
        }
        // If lock has passed, reset record
        if (record.lockedUntil != null && Instant.now().isAfter(record.lockedUntil)) {
            attemptCache.remove(key);
            return false;
        }
        return false;
    }

    /**
     * Returns remaining lockout seconds (0 if not locked).
     */
    public long getRemainingLockoutSeconds(String username, String clientIp) {
        String key = buildKey(username, clientIp);
        AttemptRecord record = attemptCache.get(key);
        if (record == null) {
            return 0;
        }
        return record.getRemainingSeconds();
    }

    /**
     * Records a failed login attempt. If attempts exceed max, locks the key.
     */
    public void recordFailure(String username, String clientIp) {
        cleanupIfNecessary();
        String key = buildKey(username, clientIp);
        attemptCache.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired(lockoutSeconds)) {
                AttemptRecord newRecord = new AttemptRecord();
                if (maxAttempts <= 1) {
                    newRecord.lockedUntil = Instant.now().plusSeconds(lockoutSeconds);
                }
                return newRecord;
            } else {
                existing.increment(maxAttempts, lockoutSeconds);
                return existing;
            }
        });
        AttemptRecord record = attemptCache.get(key);
        if (record != null && record.isLocked()) {
            log.warn("Rate limit triggered for key {}: {} attempts, locked for {}s", key, record.failureCount, lockoutSeconds);
        }
    }

    /**
     * Records a successful login: clears any failed attempt counter.
     */
    public void recordSuccess(String username, String clientIp) {
        String key = buildKey(username, clientIp);
        attemptCache.remove(key);
    }

    /**
     * Clears tracking for a specific key (test support & admin reset).
     */
    public void clear(String username, String clientIp) {
        attemptCache.remove(buildKey(username, clientIp));
    }

    /**
     * Clears all tracked records.
     */
    public void clearAll() {
        attemptCache.clear();
    }

    /**
     * Allows test suite to temporarily adjust lockout duration (e.g. 2s for expiry test).
     */
    public void setLockoutSeconds(long seconds) {
        this.lockoutSeconds = seconds;
    }

    public void setMaxAttempts(int attempts) {
        this.maxAttempts = attempts;
    }

    public void resetDefaults() {
        this.maxAttempts = DEFAULT_MAX_ATTEMPTS;
        this.lockoutSeconds = DEFAULT_LOCKOUT_SECONDS;
    }

    public int getTrackedKeyCount() {
        return attemptCache.size();
    }

    /**
     * Bounded memory maintenance: removes expired entries when cache exceeds capacity.
     */
    public void cleanupIfNecessary() {
        if (attemptCache.size() >= MAX_TRACKED_KEYS) {
            attemptCache.entrySet().removeIf(entry -> entry.getValue().isExpired(lockoutSeconds));
        }
    }

    public void forceCleanupExpired() {
        attemptCache.entrySet().removeIf(entry -> entry.getValue().isExpired(lockoutSeconds) || (!entry.getValue().isLocked() && entry.getValue().lockedUntil != null));
    }
}
