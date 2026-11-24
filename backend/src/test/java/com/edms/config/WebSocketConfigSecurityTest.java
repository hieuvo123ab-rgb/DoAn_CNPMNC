package com.edms.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WebSocketConfigSecurityTest {
    private static UsernamePasswordAuthenticationToken identity(String role) {
        return new UsernamePasswordAuthenticationToken("test-user", null,
                List.of(new SimpleGrantedAuthority(role)));
    }

    @Test
    void userNotificationQueueIsAllowedForAuthenticatedUser() {
        assertDoesNotThrow(() -> WebSocketConfig.authorizeSubscription(
                "/user/queue/notifications", identity("ROLE_STAFF")));
    }

    @Test
    void adminTopicRequiresAdminRole() {
        assertThrows(AccessDeniedException.class, () -> WebSocketConfig.authorizeSubscription(
                "/topic/admin/notifications", identity("ROLE_STAFF")));
        assertDoesNotThrow(() -> WebSocketConfig.authorizeSubscription(
                "/topic/admin/notifications", identity("ROLE_ADMIN")));
    }

    @Test
    void crossUserAndDirectBrokerSubscriptionsAreRejected() {
        for (String destination : List.of("/user/alice/queue/notifications",
                "/queue/notifications", "/topic/notifications",
                "/topic/admin/notifications/extra", "/app/notifications")) {
            assertThrows(AccessDeniedException.class, () ->
                    WebSocketConfig.authorizeSubscription(destination, identity("ROLE_ADMIN")), destination);
        }
        assertThrows(AccessDeniedException.class, () ->
                WebSocketConfig.authorizeSubscription("/user/queue/notifications", null));
        assertThrows(AccessDeniedException.class, () ->
                WebSocketConfig.authorizeSubscription(null, identity("ROLE_ADMIN")));
    }
}
