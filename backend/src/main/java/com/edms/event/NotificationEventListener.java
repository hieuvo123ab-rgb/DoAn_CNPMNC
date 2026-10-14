package com.edms.event;

import com.edms.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("[NotificationEventListener] Processing AFTER_COMMIT notification event: type={}, eventKey={}, docId={}",
                event.getType(), event.getEventKey(), event.getDocumentId());

        try {
            if (event.isSimulatePersistenceFailure()) {
                log.warn("[NotificationEventListener] Simulating notification persistence failure after core commit (TEST 365)");
                throw new RuntimeException("Simulated notification database persistence failure after commit");
            }

            if (event.isForAdmins()) {
                notificationService.createNotificationsForAdmins(
                        event.getType(),
                        event.getTitle(),
                        event.getMessage(),
                        event.getDocumentId(),
                        event.getVersionNumber(),
                        event.getRelatedEntityType(),
                        event.getRelatedEntityId(),
                        event.getActionKey(),
                        event.getExcludeUsername(),
                        event.getEventKey()
                );
            } else {
                notificationService.createNotification(
                        event.getRecipientUsername(),
                        event.getType(),
                        event.getTitle(),
                        event.getMessage(),
                        event.getDocumentId(),
                        event.getVersionNumber(),
                        event.getRelatedEntityType(),
                        event.getRelatedEntityId(),
                        event.getActionKey(),
                        event.getEventKey()
                );
            }
        } catch (Exception e) {
            log.error("[NotificationEventListener] Error processing AFTER_COMMIT notification (core transaction remains committed): {}",
                    e.getMessage(), e);
        }
    }
}
