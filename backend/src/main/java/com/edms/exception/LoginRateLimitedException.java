package com.edms.exception;

/**
 * Phase 17: Thrown when an authentication request exceeds rate limiting thresholds.
 * Results in HTTP 429 Too Many Requests with Retry-After header.
 */
public class LoginRateLimitedException extends RuntimeException {

    private final long retryAfterSeconds;

    public LoginRateLimitedException(long retryAfterSeconds) {
        super("Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public LoginRateLimitedException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
