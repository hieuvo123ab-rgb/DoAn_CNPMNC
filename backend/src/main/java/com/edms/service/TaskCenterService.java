package com.edms.service;

import com.edms.dto.TaskDto;
import com.edms.dto.TaskType;
import com.edms.entity.*;
import com.edms.repository.DocumentDispositionRepository;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TaskCenterService {

    private final DocumentReviewRepository documentReviewRepository;
    private final DocumentDispositionRepository documentDispositionRepository;
    private final DocumentRepository documentRepository;
    private final DocumentReviewService documentReviewService;
    private final DocumentAccessService documentAccessService;

    public TaskCenterService(DocumentReviewRepository documentReviewRepository,
                             DocumentDispositionRepository documentDispositionRepository,
                             DocumentRepository documentRepository,
                             DocumentReviewService documentReviewService,
                             DocumentAccessService documentAccessService) {
        this.documentReviewRepository = documentReviewRepository;
        this.documentDispositionRepository = documentDispositionRepository;
        this.documentRepository = documentRepository;
        this.documentReviewService = documentReviewService;
        this.documentAccessService = documentAccessService;
    }

    /**
     * Derives actionable work items from authoritative source-of-truth tables.
     * Absolutely no duplicated Task entity or workflow engine state.
     */
    @Transactional(readOnly = true)
    public List<TaskDto> getUserTasks(String username, boolean isAdmin) {
        List<TaskDto> tasks = new ArrayList<>();

        // 1. For ROLE_ADMIN: REVIEW_PENDING tasks
        if (isAdmin) {
            List<DocumentReview> pendingReviews = documentReviewRepository
                    .findByStatusOrderBySubmittedAtAsc(ReviewStatus.PENDING);
            for (DocumentReview r : pendingReviews) {
                Document doc = r.getDocument();
                if (doc == null || doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
                    continue; // Skip disposed
                }
                tasks.add(new TaskDto(
                        TaskType.REVIEW_PENDING,
                        doc.getId(),
                        doc.getTitle(),
                        r.getVersionNumber(),
                        r.getId(),
                        r.getStatus().name(),
                        r.getSubmittedAt(),
                        "OPEN_REVIEW_QUEUE",
                        "HIGH"
                ));
            }

            // 2. For ROLE_ADMIN: DISPOSITION_PENDING tasks
            List<DocumentDisposition> pendingDispositions = documentDispositionRepository
                    .findByStatusOrderByRequestedAtAsc(DispositionStatus.PENDING);
            for (DocumentDisposition d : pendingDispositions) {
                Document doc = d.getDocument();
                if (doc == null || doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
                    continue; // Skip disposed
                }
                tasks.add(new TaskDto(
                        TaskType.DISPOSITION_PENDING,
                        doc.getId(),
                        doc.getTitle(),
                        doc.getCurrentVersionNumber(),
                        d.getId(),
                        d.getStatus().name(),
                        d.getRequestedAt(),
                        "OPEN_DISPOSITION_QUEUE",
                        "HIGH"
                ));
            }
        }

        // 3. For Document Owner (Staff or Admin): REVISION_REQUIRED tasks
        if (username != null && !username.isBlank()) {
            List<Document> myDocs = documentRepository.findByCreatedByOrderByCreatedAtDesc(username);
            for (Document doc : myDocs) {
                // Section 25: Never expose disposed document tasks
                if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
                    continue;
                }
                // Section 24: Enforce ACL
                if (!documentAccessService.canRead(doc, username, isAdmin)) {
                    continue;
                }

                int currentVersion = doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1;
                String reviewStatus = documentReviewService.deriveCurrentReviewStatus(doc.getId(), currentVersion);

                if ("REJECTED".equalsIgnoreCase(reviewStatus)) {
                    tasks.add(new TaskDto(
                            TaskType.REVISION_REQUIRED,
                            doc.getId(),
                            doc.getTitle(),
                            currentVersion,
                            doc.getId(),
                            "REJECTED",
                            doc.getUpdatedAt() != null ? doc.getUpdatedAt() : doc.getCreatedAt(),
                            "OPEN_VERSION_HISTORY",
                            "MEDIUM"
                    ));
                }
            }
        }

        return tasks;
    }
}
