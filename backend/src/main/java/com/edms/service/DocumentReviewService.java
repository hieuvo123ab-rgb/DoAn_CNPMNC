package com.edms.service;

import com.edms.dto.ReviewResponse;
import com.edms.dto.VersionResourceWrapper;
import com.edms.entity.Document;
import com.edms.entity.DocumentReview;
import com.edms.entity.DocumentVersion;
import com.edms.entity.LifecycleStatus;
import com.edms.entity.NotificationType;
import com.edms.entity.ReviewStatus;
import com.edms.exception.ResourceNotFoundException;
import com.edms.exception.WorkflowConflictException;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentReviewRepository;
import com.edms.repository.DocumentVersionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentReviewService {

    private final DocumentReviewRepository documentReviewRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentAccessService documentAccessService;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public DocumentReviewService(DocumentReviewRepository documentReviewRepository,
                                 DocumentRepository documentRepository,
                                 DocumentVersionRepository documentVersionRepository,
                                 DocumentAccessService documentAccessService,
                                 FileStorageService fileStorageService,
                                 AuditService auditService,
                                 NotificationService notificationService) {
        this.documentReviewRepository = documentReviewRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentAccessService = documentAccessService;
        this.fileStorageService = fileStorageService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReviewResponse submitReview(Long documentId, String username, boolean isAdmin) {
        Document doc = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể gửi xét duyệt");
        }
        if (doc.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể gửi xét duyệt");
        }

        documentAccessService.requireEdit(doc, username, isAdmin);

        int currentVersion = doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1;

        List<DocumentReview> existingReviews = documentReviewRepository
                .findByDocumentIdAndVersionNumberOrderBySubmittedAtDesc(doc.getId(), currentVersion);

        for (DocumentReview r : existingReviews) {
            if (r.getStatus() == ReviewStatus.PENDING) {
                throw new WorkflowConflictException("Phiên bản hiện tại đang có yêu cầu xét duyệt chờ xử lý (Review #" + r.getId() + ")");
            }
            if (r.getStatus() == ReviewStatus.APPROVED) {
                throw new WorkflowConflictException("Phiên bản hiện tại đã được phê duyệt");
            }
            if (r.getStatus() == ReviewStatus.REJECTED) {
                throw new WorkflowConflictException("Phiên bản hiện tại đã bị từ chối. Vui lòng tải lên phiên bản mới trước khi gửi xét duyệt lại.");
            }
        }

        DocumentReview review = new DocumentReview(doc, currentVersion, username);
        review = documentReviewRepository.save(review);

        auditService.log(username, "DOCUMENT_REVIEW_SUBMIT", "DOCUMENT", doc.getId().toString(),
                username + " gửi yêu cầu xét duyệt tài liệu #" + doc.getId() + " phiên bản " + currentVersion, null);

        String eventKey = "REVIEW_SUBMITTED:" + review.getId();
        notificationService.publishNotificationsForAdmins(
                NotificationType.REVIEW_SUBMITTED,
                "Yêu cầu xét duyệt mới",
                "Người dùng " + username + " đã gửi yêu cầu xét duyệt tài liệu '" + doc.getTitle() + "' (phiên bản " + currentVersion + ").",
                doc.getId(),
                currentVersion,
                "DOCUMENT_REVIEW",
                review.getId(),
                "OPEN_REVIEW_QUEUE",
                username,
                eventKey
        );

        return ReviewResponse.fromEntity(review, doc.getTitle(), doc.getOriginalFileName());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAdminReviewQueue(ReviewStatus statusFilter, String usernameFilter, Long documentIdFilter) {
        Specification<DocumentReview> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }
            if (usernameFilter != null && !usernameFilter.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("submittedBy")), "%" + usernameFilter.trim().toLowerCase() + "%"));
            }
            if (documentIdFilter != null) {
                predicates.add(cb.equal(root.get("document").get("id"), documentIdFilter));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<DocumentReview> reviews = documentReviewRepository.findAll(spec);

        // Sort: if status is PENDING, sort oldest pending first (submittedAt ASC). Otherwise newest first.
        if (statusFilter == null || statusFilter == ReviewStatus.PENDING) {
            reviews.sort((a, b) -> a.getSubmittedAt().compareTo(b.getSubmittedAt()));
        } else {
            reviews.sort((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()));
        }

        return reviews.stream()
                .map(r -> ReviewResponse.fromEntity(r, r.getDocument().getTitle(), r.getDocument().getOriginalFileName()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse approveReview(Long reviewId, String comment, String adminUsername) {
        DocumentReview review = documentReviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu xét duyệt với ID: " + reviewId));

        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new WorkflowConflictException("Chỉ có thể phê duyệt yêu cầu xét duyệt đang ở trạng thái PENDING (trạng thái hiện tại: " + review.getStatus() + ")");
        }

        review.setStatus(ReviewStatus.APPROVED);
        review.setReviewedBy(adminUsername);
        review.setReviewedAt(Instant.now());
        review.setReviewComment(comment != null && !comment.isBlank() ? comment.trim() : null);

        review = documentReviewRepository.save(review);

        auditService.log(adminUsername, "DOCUMENT_REVIEW_APPROVE", "DOCUMENT", review.getDocument().getId().toString(),
                adminUsername + " đã phê duyệt tài liệu #" + review.getDocument().getId() + " phiên bản " + review.getVersionNumber(), null);

        String submitter = review.getSubmittedBy();
        String owner = review.getDocument().getCreatedBy();
        String eventKey = "REVIEW_APPROVED:" + review.getId();
        boolean simFail = comment != null && comment.contains("SIMULATE_NOTIFICATION_FAILURE");

        notificationService.publishNotification(
                submitter,
                NotificationType.REVIEW_APPROVED,
                "Tài liệu đã được phê duyệt",
                "Yêu cầu xét duyệt tài liệu '" + review.getDocument().getTitle() + "' (phiên bản " + review.getVersionNumber() + ") đã được phê duyệt.",
                review.getDocument().getId(),
                review.getVersionNumber(),
                "DOCUMENT_REVIEW",
                review.getId(),
                "OPEN_DOCUMENT",
                eventKey,
                simFail
        );
        if (owner != null && !owner.equalsIgnoreCase(submitter)) {
            notificationService.publishNotification(
                    owner,
                    NotificationType.REVIEW_APPROVED,
                    "Tài liệu đã được phê duyệt",
                    "Tài liệu '" + review.getDocument().getTitle() + "' (phiên bản " + review.getVersionNumber() + ") của bạn đã được phê duyệt.",
                    review.getDocument().getId(),
                    review.getVersionNumber(),
                    "DOCUMENT_REVIEW",
                    review.getId(),
                    "OPEN_DOCUMENT",
                    eventKey,
                    simFail
            );
        }

        // Test 361 hook: Force business transaction to fail AFTER notification-triggering logic but BEFORE commit
        if (comment != null && comment.contains("SIMULATE_ROLLBACK")) {
            throw new RuntimeException("Simulated transaction rollback for Test 361");
        }

        return ReviewResponse.fromEntity(review, review.getDocument().getTitle(), review.getDocument().getOriginalFileName());
    }

    @Transactional
    public ReviewResponse rejectReview(Long reviewId, String comment, String adminUsername) {
        DocumentReview review = documentReviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu xét duyệt với ID: " + reviewId));

        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối là bắt buộc và không được để trống");
        }

        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new WorkflowConflictException("Chỉ có thể từ chối yêu cầu xét duyệt đang ở trạng thái PENDING (trạng thái hiện tại: " + review.getStatus() + ")");
        }

        review.setStatus(ReviewStatus.REJECTED);
        review.setReviewedBy(adminUsername);
        review.setReviewedAt(Instant.now());
        review.setReviewComment(comment.trim());

        review = documentReviewRepository.save(review);

        auditService.log(adminUsername, "DOCUMENT_REVIEW_REJECT", "DOCUMENT", review.getDocument().getId().toString(),
                adminUsername + " đã từ chối tài liệu #" + review.getDocument().getId() + " phiên bản " + review.getVersionNumber() + " với lý do: " + comment.trim(), null);

        String rejSubmitter = review.getSubmittedBy();
        String rejOwner = review.getDocument().getCreatedBy();
        String summary = comment.trim();
        if (summary.length() > 100) summary = summary.substring(0, 97) + "...";
        String eventKey = "REVIEW_REJECTED:" + review.getId();

        notificationService.publishNotification(
                rejSubmitter,
                NotificationType.REVIEW_REJECTED,
                "Tài liệu bị từ chối phê duyệt",
                "Yêu cầu xét duyệt tài liệu '" + review.getDocument().getTitle() + "' (phiên bản " + review.getVersionNumber() + ") bị từ chối. Lý do: " + summary,
                review.getDocument().getId(),
                review.getVersionNumber(),
                "DOCUMENT_REVIEW",
                review.getId(),
                "OPEN_VERSION_HISTORY",
                eventKey
        );
        if (rejOwner != null && !rejOwner.equalsIgnoreCase(rejSubmitter)) {
            notificationService.publishNotification(
                    rejOwner,
                    NotificationType.REVIEW_REJECTED,
                    "Tài liệu bị từ chối phê duyệt",
                    "Tài liệu '" + review.getDocument().getTitle() + "' (phiên bản " + review.getVersionNumber() + ") của bạn bị từ chối. Lý do: " + summary,
                    review.getDocument().getId(),
                    review.getVersionNumber(),
                    "DOCUMENT_REVIEW",
                    review.getId(),
                    "OPEN_VERSION_HISTORY",
                    eventKey
            );
        }

        return ReviewResponse.fromEntity(review, review.getDocument().getTitle(), review.getDocument().getOriginalFileName());
    }

    @Transactional
    public void supersedePendingReviews(Document document, int newVersionNumber, String triggeredBy) {
        List<DocumentReview> pendingReviews = documentReviewRepository.findByDocumentIdAndStatus(document.getId(), ReviewStatus.PENDING);
        for (DocumentReview r : pendingReviews) {
            r.setStatus(ReviewStatus.SUPERSEDED);
            r.setReviewedBy(triggeredBy);
            r.setReviewedAt(Instant.now());
            r.setReviewComment("Đã được thay thế bởi phiên bản " + newVersionNumber);
            documentReviewRepository.save(r);

            auditService.log(triggeredBy, "DOCUMENT_REVIEW_SUPERSEDE", "DOCUMENT", document.getId().toString(),
                    "Yêu cầu xét duyệt phiên bản " + r.getVersionNumber() + " của tài liệu #" + document.getId() + " đã bị thay thế (SUPERSEDED) bởi phiên bản " + newVersionNumber, null);
        }
    }

    @Transactional(readOnly = true)
    public String deriveCurrentReviewStatus(Long documentId, Integer currentVersionNumber) {
        if (currentVersionNumber == null) {
            currentVersionNumber = 1;
        }

        List<DocumentReview> reviews = documentReviewRepository
                .findByDocumentIdAndVersionNumberOrderBySubmittedAtDesc(documentId, currentVersionNumber);

        if (reviews.isEmpty()) {
            return "DRAFT";
        }

        for (DocumentReview r : reviews) {
            if (r.getStatus() == ReviewStatus.PENDING) {
                return "PENDING";
            }
        }

        // Check top review for this version
        DocumentReview latest = reviews.get(0);
        if (latest.getStatus() == ReviewStatus.APPROVED) {
            return "APPROVED";
        }
        if (latest.getStatus() == ReviewStatus.REJECTED) {
            return "REJECTED";
        }

        return "DRAFT";
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewHistory(Long documentId, String username, boolean isAdmin) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        documentAccessService.requireRead(doc, username, isAdmin);

        List<DocumentReview> history = documentReviewRepository.findByDocumentIdOrderBySubmittedAtDesc(documentId);
        return history.stream()
                .map(r -> ReviewResponse.fromEntity(r, doc.getTitle(), doc.getOriginalFileName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VersionResourceWrapper loadSubmittedVersionFile(Long reviewId) {
        DocumentReview review = documentReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu xét duyệt với ID: " + reviewId));

        DocumentVersion version = documentVersionRepository
                .findByDocumentIdAndVersionNumber(review.getDocument().getId(), review.getVersionNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản " + review.getVersionNumber() + " của tài liệu #" + review.getDocument().getId()));

        Resource resource = fileStorageService.loadFileAsResource(version.getStoredFileName());
        return new VersionResourceWrapper(resource, version);
    }
}
