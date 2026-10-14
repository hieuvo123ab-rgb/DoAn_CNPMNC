package com.edms.repository;

import com.edms.entity.Notification;
import com.edms.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername, Pageable pageable);

    Page<Notification> findByRecipientUsernameAndReadOrderByCreatedAtDesc(String recipientUsername, boolean read, Pageable pageable);

    long countByRecipientUsernameAndReadFalse(String recipientUsername);

    long countByReadFalse();

    Optional<Notification> findByIdAndRecipientUsername(Long id, String recipientUsername);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :readAt WHERE n.recipientUsername = :recipientUsername AND n.read = false")
    int markAllReadForRecipient(@Param("recipientUsername") String recipientUsername, @Param("readAt") Instant readAt);

    boolean existsByRecipientUsernameAndTypeAndDocumentIdAndVersionNumber(
            String recipientUsername, NotificationType type, Long documentId, Integer versionNumber);

    boolean existsByRecipientUsernameAndTypeAndRelatedEntityTypeAndRelatedEntityId(
            String recipientUsername, NotificationType type, String relatedEntityType, Long relatedEntityId);

    boolean existsByRecipientUsernameAndEventKey(String recipientUsername, String eventKey);

    Optional<Notification> findByRecipientUsernameAndEventKey(String recipientUsername, String eventKey);
}
