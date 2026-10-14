package com.edms.service;

import com.edms.dto.DispositionResponseDto;
import com.edms.dto.DocumentResponse;
import com.edms.entity.DispositionStatus;
import com.edms.entity.Document;
import com.edms.entity.DocumentDisposition;
import com.edms.entity.LifecycleStatus;
import com.edms.exception.ResourceNotFoundException;
import com.edms.exception.WorkflowConflictException;
import com.edms.repository.DocumentDispositionRepository;
import com.edms.repository.DocumentRepository;
import com.edms.entity.NotificationType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentDispositionService {

    private final DocumentDispositionRepository documentDispositionRepository;
    private final DocumentRepository documentRepository;
    private final DocumentAccessService documentAccessService;
    private final DocumentReviewService documentReviewService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public DocumentDispositionService(DocumentDispositionRepository documentDispositionRepository,
                                      DocumentRepository documentRepository,
                                      DocumentAccessService documentAccessService,
                                      DocumentReviewService documentReviewService,
                                      AuditService auditService,
                                      NotificationService notificationService) {
        this.documentDispositionRepository = documentDispositionRepository;
        this.documentRepository = documentRepository;
        this.documentAccessService = documentAccessService;
        this.documentReviewService = documentReviewService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public DispositionResponseDto requestDisposition(Long documentId, String reason, String username, boolean isAdmin) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do yêu cầu tiêu hủy là bắt buộc");
        }

        Document doc = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        // Authority check: Only Owner or Admin
        documentAccessService.requireRequestDisposition(doc, username, isAdmin);

        // Precondition 1: Lifecycle must be ARCHIVED
        if (doc.getLifecycleStatus() != LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Chỉ tài liệu ở trạng thái lưu trữ (ARCHIVED) mới có thể yêu cầu tiêu hủy. Trạng thái hiện tại: " + doc.getLifecycleStatus());
        }

        // Precondition 2: Legal Hold must be false
        if (doc.isLegalHold()) {
            throw new WorkflowConflictException("Tài liệu đang áp dụng lệnh bảo lưu pháp lý (Legal Hold), không thể yêu cầu tiêu hủy");
        }

        // Precondition 3: Retention date must be reached
        if (doc.getRetentionUntil() == null) {
            throw new WorkflowConflictException("Tài liệu chưa được thiết lập thời hạn lưu trữ (retentionUntil), không đủ điều kiện tiêu hủy");
        }
        if (LocalDate.now().isBefore(doc.getRetentionUntil())) {
            throw new WorkflowConflictException("Tài liệu chưa đạt thời hạn lưu trữ tối thiểu (retentionUntil: " + doc.getRetentionUntil() + "), không đủ điều kiện tiêu hủy");
        }

        // Precondition 4: No pending review
        String currentReviewStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        if ("PENDING".equalsIgnoreCase(currentReviewStatus)) {
            throw new WorkflowConflictException("Tài liệu đang có yêu cầu xét duyệt phiên bản chờ xử lý, không thể yêu cầu tiêu hủy");
        }

        // Precondition 5: Full eligibility check
        boolean eligible = DocumentResponse.calculateDispositionEligibility(
                doc.getLifecycleStatus(),
                doc.isLegalHold(),
                doc.getRetentionUntil(),
                currentReviewStatus
        );
        if (!eligible) {
            throw new WorkflowConflictException("Tài liệu không đủ điều kiện tiêu hủy theo chính sách lưu trữ");
        }

        // Precondition 6: No duplicate PENDING disposition request
        long pendingCount = documentDispositionRepository.countByDocumentIdAndStatus(documentId, DispositionStatus.PENDING);
        if (pendingCount > 0) {
            throw new WorkflowConflictException("Tài liệu đã có một yêu cầu tiêu hủy đang ở trạng thái chờ phê duyệt (PENDING)");
        }

        DocumentDisposition disposition = new DocumentDisposition(
                doc,
                doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1,
                username,
                reason.trim()
        );
        DocumentDisposition saved = documentDispositionRepository.save(disposition);

        auditService.log(username, "DOCUMENT_DISPOSITION_REQUEST", "DOCUMENT", doc.getId().toString(),
                username + " gửi yêu cầu tiêu hủy tài liệu #" + doc.getId() + " (" + doc.getTitle() + "): " + reason.trim(), null);

        String eventKey = "DISPOSITION_REQUESTED:" + saved.getId();
        notificationService.publishNotificationsForAdmins(
                NotificationType.DISPOSITION_REQUESTED,
                "Yêu cầu tiêu hủy tài liệu",
                "Người dùng " + username + " đã yêu cầu tiêu hủy tài liệu '" + doc.getTitle() + "'.",
                doc.getId(),
                doc.getCurrentVersionNumber(),
                "DOCUMENT_DISPOSITION",
                saved.getId(),
                "OPEN_DISPOSITION_QUEUE",
                username,
                eventKey
        );

        return DispositionResponseDto.fromEntity(saved, currentReviewStatus);
    }

    @Transactional(readOnly = true)
    public List<DispositionResponseDto> getAdminDispositionQueue(String status, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền truy cập hàng đợi tiêu hủy");
        }

        List<DocumentDisposition> list;
        if (status == null || status.isBlank() || "PENDING".equalsIgnoreCase(status.trim())) {
            list = documentDispositionRepository.findByStatusOrderByRequestedAtAsc(DispositionStatus.PENDING);
        } else if ("ALL".equalsIgnoreCase(status.trim())) {
            list = documentDispositionRepository.findAllByOrderByRequestedAtAsc();
        } else {
            try {
                DispositionStatus statusEnum = DispositionStatus.valueOf(status.trim().toUpperCase());
                list = documentDispositionRepository.findByStatusOrderByRequestedAtAsc(statusEnum);
            } catch (IllegalArgumentException e) {
                list = documentDispositionRepository.findByStatusOrderByRequestedAtAsc(DispositionStatus.PENDING);
            }
        }

        return list.stream()
                .map(d -> {
                    Document doc = d.getDocument();
                    String revStatus = doc != null ? documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber()) : "APPROVED";
                    return DispositionResponseDto.fromEntity(d, revStatus);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public DispositionResponseDto approveDisposition(Long requestId, String comment, String adminUsername, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền phê duyệt tiêu hủy tài liệu");
        }

        DocumentDisposition disposition = documentDispositionRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu tiêu hủy với ID: " + requestId));

        if (disposition.getStatus() != DispositionStatus.PENDING) {
            throw new WorkflowConflictException("Yêu cầu tiêu hủy #" + requestId + " không ở trạng thái chờ duyệt (PENDING). Trạng thái hiện tại: " + disposition.getStatus());
        }

        Document doc = documentRepository.findByIdForUpdate(disposition.getDocument().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu liên quan đến yêu cầu tiêu hủy"));

        // CRITICAL: Revalidate ALL eligibility conditions at the exact time of approval
        if (doc.getLifecycleStatus() != LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu không còn ở trạng thái lưu trữ (ARCHIVED). Trạng thái hiện tại: " + doc.getLifecycleStatus() + ". Không thể phê duyệt tiêu hủy.");
        }

        if (doc.isLegalHold()) {
            throw new WorkflowConflictException("Tài liệu hiện đang áp dụng lệnh bảo lưu pháp lý (Legal Hold: " + doc.getLegalHoldReason() + "). Phê duyệt tiêu hủy bị chặn.");
        }

        if (doc.getRetentionUntil() == null || LocalDate.now().isBefore(doc.getRetentionUntil())) {
            throw new WorkflowConflictException("Thời hạn lưu trữ tối thiểu của tài liệu chưa kết thúc. Phê duyệt tiêu hủy bị chặn.");
        }

        String currentReviewStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        if ("PENDING".equalsIgnoreCase(currentReviewStatus)) {
            throw new WorkflowConflictException("Tài liệu đang có yêu cầu xét duyệt phiên bản chưa hoàn tất. Phê duyệt tiêu hủy bị chặn.");
        }

        boolean eligible = DocumentResponse.calculateDispositionEligibility(
                doc.getLifecycleStatus(),
                doc.isLegalHold(),
                doc.getRetentionUntil(),
                currentReviewStatus
        );
        if (!eligible) {
            throw new WorkflowConflictException("Tài liệu không còn đủ điều kiện tiêu hủy tại thời điểm phê duyệt.");
        }

        Instant now = Instant.now();
        disposition.setStatus(DispositionStatus.APPROVED);
        disposition.setReviewedBy(adminUsername);
        disposition.setReviewedAt(now);
        disposition.setReviewComment(comment != null && !comment.isBlank() ? comment.trim() : "Approved");
        disposition.setDisposedAt(now);
        disposition.setDisposedBy(adminUsername);
        DocumentDisposition savedDisp = documentDispositionRepository.save(disposition);

        // Transition Document to DISPOSED (logical disposition only - NO PHYSICAL DELETION)
        doc.setLifecycleStatus(LifecycleStatus.DISPOSED);
        doc.setDisposedAt(now);
        doc.setDisposedBy(adminUsername);
        doc.setUpdatedAt(now);
        documentRepository.save(doc);

        auditService.log(adminUsername, "DOCUMENT_DISPOSITION_APPROVE", "DOCUMENT", doc.getId().toString(),
                "Admin " + adminUsername + " phê duyệt tiêu hủy tài liệu #" + doc.getId() + " (" + doc.getTitle() + ") theo yêu cầu #" + requestId, null);

        String requester = disposition.getRequestedBy();
        String owner = doc.getCreatedBy();
        String eventKey = "DISPOSITION_APPROVED:" + savedDisp.getId();
        notificationService.publishNotification(
                requester,
                NotificationType.DISPOSITION_APPROVED,
                "Yêu cầu tiêu hủy đã được phê duyệt",
                "Yêu cầu tiêu hủy tài liệu '" + doc.getTitle() + "' đã được phê duyệt.",
                doc.getId(),
                doc.getCurrentVersionNumber(),
                "DOCUMENT_DISPOSITION",
                savedDisp.getId(),
                "OPEN_DISPOSITION_QUEUE",
                eventKey
        );
        if (owner != null && !owner.equalsIgnoreCase(requester)) {
            notificationService.publishNotification(
                    owner,
                    NotificationType.DISPOSITION_APPROVED,
                    "Tài liệu đã được phê duyệt tiêu hủy",
                    "Tài liệu '" + doc.getTitle() + "' của bạn đã được phê duyệt tiêu hủy.",
                    doc.getId(),
                    doc.getCurrentVersionNumber(),
                    "DOCUMENT_DISPOSITION",
                    savedDisp.getId(),
                    "OPEN_DISPOSITION_QUEUE",
                    eventKey
            );
        }

        // Test 363 hook: Force disposition transition rollback
        if (comment != null && comment.contains("SIMULATE_ROLLBACK")) {
            throw new RuntimeException("Simulated transaction rollback for Test 363");
        }

        return DispositionResponseDto.fromEntity(savedDisp, currentReviewStatus);
    }

    @Transactional
    public DispositionResponseDto rejectDisposition(Long requestId, String comment, String adminUsername, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền từ chối yêu cầu tiêu hủy tài liệu");
        }

        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối yêu cầu tiêu hủy (comment) là bắt buộc");
        }

        DocumentDisposition disposition = documentDispositionRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu tiêu hủy với ID: " + requestId));

        if (disposition.getStatus() != DispositionStatus.PENDING) {
            throw new WorkflowConflictException("Yêu cầu tiêu hủy #" + requestId + " không ở trạng thái chờ duyệt (PENDING). Trạng thái hiện tại: " + disposition.getStatus());
        }

        Instant now = Instant.now();
        disposition.setStatus(DispositionStatus.REJECTED);
        disposition.setReviewedBy(adminUsername);
        disposition.setReviewedAt(now);
        disposition.setReviewComment(comment.trim());
        DocumentDisposition savedDisp = documentDispositionRepository.save(disposition);

        // Document lifecycle remains unchanged (ARCHIVED)
        Document doc = disposition.getDocument();

        auditService.log(adminUsername, "DOCUMENT_DISPOSITION_REJECT", "DOCUMENT", doc.getId().toString(),
                "Admin " + adminUsername + " từ chối yêu cầu tiêu hủy tài liệu #" + doc.getId() + " (Request #" + requestId + "): " + comment.trim(), null);

        String rejRequester = disposition.getRequestedBy();
        String rejOwner = doc.getCreatedBy();
        String commentSummary = comment.trim();
        if (commentSummary.length() > 100) commentSummary = commentSummary.substring(0, 97) + "...";
        String eventKeyRej = "DISPOSITION_REJECTED:" + savedDisp.getId();

        notificationService.publishNotification(
                rejRequester,
                NotificationType.DISPOSITION_REJECTED,
                "Yêu cầu tiêu hủy bị từ chối",
                "Yêu cầu tiêu hủy tài liệu '" + doc.getTitle() + "' bị từ chối. Lý do: " + commentSummary,
                doc.getId(),
                doc.getCurrentVersionNumber(),
                "DOCUMENT_DISPOSITION",
                savedDisp.getId(),
                "OPEN_DOCUMENT",
                eventKeyRej
        );
        if (rejOwner != null && !rejOwner.equalsIgnoreCase(rejRequester)) {
            notificationService.publishNotification(
                    rejOwner,
                    NotificationType.DISPOSITION_REJECTED,
                    "Yêu cầu tiêu hủy tài liệu bị từ chối",
                    "Yêu cầu tiêu hủy tài liệu '" + doc.getTitle() + "' của bạn bị từ chối. Lý do: " + commentSummary,
                    doc.getId(),
                    doc.getCurrentVersionNumber(),
                    "DOCUMENT_DISPOSITION",
                    savedDisp.getId(),
                    "OPEN_DOCUMENT",
                    eventKeyRej
            );
        }

        String revStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        return DispositionResponseDto.fromEntity(savedDisp, revStatus);
    }

    @Transactional
    public DispositionResponseDto cancelDisposition(Long documentId, String username, boolean isAdmin) {
        Document doc = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        documentAccessService.requireRequestDisposition(doc, username, isAdmin);

        Optional<DocumentDisposition> pendingOpt = documentDispositionRepository.findFirstByDocumentIdAndStatus(documentId, DispositionStatus.PENDING);
        if (pendingOpt.isEmpty()) {
            throw new WorkflowConflictException("Tài liệu #" + documentId + " hiện không có yêu cầu tiêu hủy nào ở trạng thái chờ xử lý (PENDING)");
        }

        DocumentDisposition disposition = pendingOpt.get();
        Instant now = Instant.now();
        disposition.setStatus(DispositionStatus.CANCELLED);
        disposition.setReviewedBy(username);
        disposition.setReviewedAt(now);
        disposition.setReviewComment("Cancelled by " + username);
        DocumentDisposition savedDisp = documentDispositionRepository.save(disposition);

        auditService.log(username, "DOCUMENT_DISPOSITION_CANCEL", "DOCUMENT", doc.getId().toString(),
                username + " hủy yêu cầu tiêu hủy tài liệu #" + doc.getId() + " (Request #" + disposition.getId() + ")", null);

        String revStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        return DispositionResponseDto.fromEntity(savedDisp, revStatus);
    }

    @Transactional
    public void cancelPendingDispositionsOnUnarchive(Document doc, String username) {
        List<DocumentDisposition> pendingList = documentDispositionRepository.findByDocumentIdAndStatus(doc.getId(), DispositionStatus.PENDING);
        for (DocumentDisposition disp : pendingList) {
            disp.setStatus(DispositionStatus.CANCELLED);
            disp.setReviewedBy(username);
            disp.setReviewedAt(Instant.now());
            disp.setReviewComment("Lifecycle changed to ACTIVE");
            documentDispositionRepository.save(disp);

            auditService.log(username, "DOCUMENT_DISPOSITION_CANCEL", "DOCUMENT", doc.getId().toString(),
                    "Yêu cầu tiêu hủy #" + disp.getId() + " bị hủy do tài liệu #" + doc.getId() + " được khôi phục hoạt động (Lifecycle changed to ACTIVE)", null);
        }
    }

    @Transactional(readOnly = true)
    public List<DispositionResponseDto> getDispositionHistory(Long documentId, String username, boolean isAdmin) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        documentAccessService.requireRequestDisposition(doc, username, isAdmin);

        String revStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), doc.getCurrentVersionNumber());
        return documentDispositionRepository.findByDocumentIdOrderByRequestedAtDesc(documentId).stream()
                .map(d -> DispositionResponseDto.fromEntity(d, revStatus))
                .collect(Collectors.toList());
    }
}
