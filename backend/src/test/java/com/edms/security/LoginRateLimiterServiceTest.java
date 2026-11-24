package com.edms.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginRateLimiterServiceTest {

    @Test
    void clearUserRemovesOnlyMatchingAccountAcrossIps() {
        LoginRateLimiterService limiter = new LoginRateLimiterService();
        limiter.recordFailure("Alice", "10.0.0.1");
        limiter.recordFailure("ALICE", "10.0.0.2");
        limiter.recordFailure("bob", "10.0.0.1");

        assertEquals(2, limiter.clearUser("  aLiCe  "));
        assertEquals(1, limiter.getTrackedKeyCount());
        assertEquals(0, limiter.clearUser("alice"));
        assertEquals(1, limiter.clearUser("bob"));
        assertEquals(0, limiter.getTrackedKeyCount());
    }

    @Test
    void clearUserRejectsBlankUsernameWithoutResettingOtherUsers() {
        LoginRateLimiterService limiter = new LoginRateLimiterService();
        limiter.recordFailure("bob", "10.0.0.1");

        assertThrows(IllegalArgumentException.class, () -> limiter.clearUser(" "));
        assertThrows(IllegalArgumentException.class, () -> limiter.clearUser(null));
        assertEquals(1, limiter.getTrackedKeyCount());
    }
}
