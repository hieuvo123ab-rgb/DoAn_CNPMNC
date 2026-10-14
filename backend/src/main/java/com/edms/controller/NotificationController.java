package com.edms.controller;

import com.edms.dto.NotificationResponse;
import com.edms.entity.Notification;
import com.edms.entity.NotificationType;
import com.edms.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Lists notifications for current authenticated user.
     * Strictly isolates feed per user; refuses any external username override.
     * Enforces pagination validation: page >= 0, size between 1 and 100.
     */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "unreadOnly", required = false) Boolean unreadOnly,
            @RequestParam(value = "username", required = false) String forbiddenUsernameParam,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        // Section 25: Strict pagination validation (page >= 0, size 1-100)
        if (page < 0 || size < 1 || size > 100) {
            return ResponseEntity.badRequest().build();
        }

        if (forbiddenUsernameParam != null && !forbiddenUsernameParam.isBlank()
                && !forbiddenUsernameParam.equalsIgnoreCase(authentication.getName())) {
            // Section 13: Do NOT accept ?username=otherUser for normal notification listing.
            return ResponseEntity.status(403).build();
        }

        String currentUsername = authentication.getName();
        Page<NotificationResponse> result = notificationService.getCurrentUserNotifications(
                currentUsername, unreadOnly, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * Returns unread notification counter for current user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        long count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Marks a specific notification as read.
     * Enforces ownership: returns 404 if notification belongs to another user.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable("id") Long id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        NotificationResponse response = notificationService.markRead(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Marks all unread notifications as read for current user.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        int updatedCount = notificationService.markAllRead(authentication.getName());
        return ResponseEntity.ok(Map.of("markedCount", updatedCount));
    }

    /**
     * Test endpoint for verifying concurrent deduplication (TEST 366).
     */
    @PostMapping("/test-dedup")
    public ResponseEntity<NotificationResponse> testDedup(
            @RequestParam("eventKey") String eventKey,
            @RequestParam(value = "title", defaultValue = "Test Dedup") String title,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        Notification notification = null;
        try {
            notification = notificationService.createNotification(
                    authentication.getName(),
                    NotificationType.DOCUMENT_SHARED,
                    title,
                    "Concurrent deduplication test message",
                    null,
                    null,
                    "TEST",
                    null,
                    "OPEN_DOCUMENT",
                    eventKey
            );
        } catch (Exception e) {
            log.info("[test-dedup] Handled concurrent duplicate insertion: {}", e.getMessage());
        }
        return ResponseEntity.ok(notification != null ? NotificationResponse.fromEntity(notification) : null);
    }
}
