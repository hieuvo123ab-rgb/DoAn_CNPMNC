package com.edms.service;

import com.edms.dto.NotificationResponse;
import com.edms.entity.Notification;
import com.edms.entity.NotificationType;
import com.edms.entity.Role;
import com.edms.entity.User;
import com.edms.event.NotificationEvent;
import com.edms.exception.ResourceNotFoundException;
import com.edms.repository.NotificationRepository;
import com.edms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               ApplicationEventPublisher eventPublisher) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    // -------------------------------------------------------------------------
    // Phase 14 Hardened: Transaction-safe AFTER_COMMIT Event Publishing
    // -------------------------------------------------------------------------

    /**
     * Publishes a NotificationEvent to be processed strictly AFTER_COMMIT.
     * Prevents phantom notifications if the outer business transaction rolls back.
     */
    public void publishNotification(String recipientUsername, NotificationType type, String title,
                                    String message, Long documentId, Integer versionNumber,
                                    String relatedEntityType, Long relatedEntityId, String actionKey,
                                    String eventKey, boolean simulatePersistenceFailure) {
        if (recipientUsername == null || recipientUsername.isBlank()) {
            log.warn("[Notification] Skipped notification publish: recipientUsername is empty");
            return;
        }
        eventPublisher.publishEvent(new NotificationEvent(
                recipientUsername.trim(), type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, eventKey, simulatePersistenceFailure
        ));
    }

    public void publishNotification(String recipientUsername, NotificationType type, String title,
                                    String message, Long documentId, Integer versionNumber,
                                    String relatedEntityType, Long relatedEntityId, String actionKey,
                                    String eventKey) {
        publishNotification(recipientUsername, type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, eventKey, false);
    }

    public void publishNotificationsForAdmins(NotificationType type, String title, String message,
                                             Long documentId, Integer versionNumber,
                                             String relatedEntityType, Long relatedEntityId,
                                             String actionKey, String excludeUsername,
                                             String eventKey, boolean simulatePersistenceFailure) {
        eventPublisher.publishEvent(new NotificationEvent(
                type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, excludeUsername, eventKey, simulatePersistenceFailure
        ));
    }

    public void publishNotificationsForAdmins(NotificationType type, String title, String message,
                                             Long documentId, Integer versionNumber,
                                             String relatedEntityType, Long relatedEntityId,
                                             String actionKey, String excludeUsername,
                                             String eventKey) {
        publishNotificationsForAdmins(type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, excludeUsername, eventKey, false);
    }

    public void publishTamperAlert(Long documentId, int versionNumber, String ownerUsername) {
        String title = "Cảnh báo an toàn: Phát hiện sửa đổi trái phép (TAMPERED)";
        String message = "Tài liệu #" + documentId + " phiên bản " + versionNumber +
                " không khớp mã băm SHA-256 đã đăng ký hoặc chữ ký số bị vô hiệu hóa.";
        String actionKey = "OPEN_INTEGRITY";
        String eventKey = "TAMPER:" + documentId + ":" + versionNumber;

        // 1. Notify Document Owner (if distinct)
        if (ownerUsername != null && !ownerUsername.isBlank()) {
            publishNotification(ownerUsername, NotificationType.INTEGRITY_TAMPER_DETECTED,
                    title, message, documentId, versionNumber, "DOCUMENT_VERSION", (long) versionNumber,
                    actionKey, eventKey, false);
        }

        // 2. Notify Admins
        publishNotificationsForAdmins(NotificationType.INTEGRITY_TAMPER_DETECTED,
                title, message, documentId, versionNumber, "DOCUMENT_VERSION", (long) versionNumber,
                actionKey, ownerUsername, eventKey, false);
    }

    // -------------------------------------------------------------------------
    // Core Persistence: Executed in REQUIRES_NEW after business transaction commit
    // -------------------------------------------------------------------------

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification createNotification(String recipientUsername, NotificationType type, String title,
                                           String message, Long documentId, Integer versionNumber,
                                           String relatedEntityType, Long relatedEntityId, String actionKey,
                                           String eventKey) {
        if (recipientUsername == null || recipientUsername.isBlank()) {
            log.warn("[Notification] Skipped notification creation: recipientUsername is empty");
            return null;
        }

        try {
            // Deduplication pre-check
            if (eventKey != null && !eventKey.isBlank()) {
                if (notificationRepository.existsByRecipientUsernameAndEventKey(recipientUsername.trim(), eventKey.trim())) {
                    log.info("[Notification] Deduplicated notification: user={}, eventKey={}", recipientUsername, eventKey);
                    return notificationRepository.findByRecipientUsernameAndEventKey(recipientUsername.trim(), eventKey.trim()).orElse(null);
                }
            }

            Notification notification = new Notification(
                    recipientUsername.trim(),
                    type,
                    title,
                    message,
                    documentId,
                    versionNumber,
                    relatedEntityType,
                    relatedEntityId,
                    actionKey,
                    eventKey != null && !eventKey.isBlank() ? eventKey.trim() : null
            );
            Notification saved = notificationRepository.save(notification);
            log.info("[Notification] Created {} for user={}, docId={}, eventKey={}",
                    type, recipientUsername, documentId, eventKey);
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.info("[Notification] Database-level duplicate prevented for user={}, eventKey={}", recipientUsername, eventKey);
            return null;
        } catch (Exception e) {
            log.error("[Notification] Failed to create notification {} for user={}: {}",
                    type, recipientUsername, e.getMessage(), e);
            return null;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification createNotification(String recipientUsername, NotificationType type, String title,
                                           String message, Long documentId, Integer versionNumber,
                                           String relatedEntityType, Long relatedEntityId, String actionKey) {
        return createNotification(recipientUsername, type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotificationsForAdmins(NotificationType type, String title, String message,
                                             Long documentId, Integer versionNumber,
                                             String relatedEntityType, Long relatedEntityId,
                                             String actionKey, String excludeUsername,
                                             String eventKey) {
        try {
            List<User> admins = userRepository.findByRoleAndEnabledTrue(Role.ROLE_ADMIN);
            for (User admin : admins) {
                if (excludeUsername != null && excludeUsername.equalsIgnoreCase(admin.getUsername())) {
                    continue; // Skip triggering user
                }
                createNotification(admin.getUsername(), type, title, message, documentId, versionNumber,
                        relatedEntityType, relatedEntityId, actionKey, eventKey);
            }
        } catch (Exception e) {
            log.error("[Notification] Error creating admin notifications: {}", e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotificationsForAdmins(NotificationType type, String title, String message,
                                             Long documentId, Integer versionNumber,
                                             String relatedEntityType, Long relatedEntityId,
                                             String actionKey, String excludeUsername) {
        createNotificationsForAdmins(type, title, message, documentId, versionNumber,
                relatedEntityType, relatedEntityId, actionKey, excludeUsername, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createTamperAlert(Long documentId, int versionNumber, String ownerUsername) {
        String title = "Cảnh báo an toàn: Phát hiện sửa đổi trái phép (TAMPERED)";
        String message = "Tài liệu #" + documentId + " phiên bản " + versionNumber +
                " không khớp mã băm SHA-256 đã đăng ký hoặc chữ ký số bị vô hiệu hóa.";
        String actionKey = "OPEN_INTEGRITY";
        String eventKey = "TAMPER:" + documentId + ":" + versionNumber;

        // 1. Notify Document Owner (if distinct)
        if (ownerUsername != null && !ownerUsername.isBlank()) {
            createNotification(ownerUsername, NotificationType.INTEGRITY_TAMPER_DETECTED,
                    title, message, documentId, versionNumber, "DOCUMENT_VERSION", (long) versionNumber,
                    actionKey, eventKey);
        }

        // 2. Notify Admins
        createNotificationsForAdmins(NotificationType.INTEGRITY_TAMPER_DETECTED,
                title, message, documentId, versionNumber, "DOCUMENT_VERSION", (long) versionNumber,
                actionKey, ownerUsername, eventKey);
    }

    // -------------------------------------------------------------------------
    // Query & Read Operations
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getCurrentUserNotifications(String username, Boolean unreadOnly, int page, int size) {
        if (size > 100) size = 100;
        if (size < 1) size = 20;
        if (page < 0) page = 0;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> entityPage;
        if (Boolean.TRUE.equals(unreadOnly)) {
            entityPage = notificationRepository.findByRecipientUsernameAndReadOrderByCreatedAtDesc(username, false, pageable);
        } else {
            entityPage = notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username, pageable);
        }
        return entityPage.map(NotificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        return notificationRepository.countByRecipientUsernameAndReadFalse(username);
    }

    @Transactional
    public NotificationResponse markRead(Long id, String username) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo không tồn tại"));

        if (!notification.getRecipientUsername().equalsIgnoreCase(username)) {
            throw new ResourceNotFoundException("Thông báo không tồn tại");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllRead(String username) {
        return notificationRepository.markAllReadForRecipient(username, Instant.now());
    }

    @Transactional(readOnly = true)
    public boolean existsForEvent(String recipientUsername, NotificationType type, Long documentId, Integer versionNumber) {
        return notificationRepository.existsByRecipientUsernameAndTypeAndDocumentIdAndVersionNumber(
                recipientUsername, type, documentId, versionNumber);
    }
}
