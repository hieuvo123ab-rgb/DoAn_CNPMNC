package com.edms.controller;

import com.edms.dto.ReviewActionRequest;
import com.edms.dto.ReviewResponse;
import com.edms.dto.VersionResourceWrapper;
import com.edms.entity.ReviewStatus;
import com.edms.service.AuditService;
import com.edms.service.DocumentReviewService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminReviewController {

    private final DocumentReviewService documentReviewService;
    private final AuditService auditService;

    public AdminReviewController(DocumentReviewService documentReviewService, AuditService auditService) {
        this.documentReviewService = documentReviewService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviewQueue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Long documentId) {

        ReviewStatus statusEnum = null;
        if (status == null || status.isBlank()) {
            statusEnum = ReviewStatus.PENDING;
        } else if (!"ALL".equalsIgnoreCase(status.trim())) {
            try {
                statusEnum = ReviewStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                statusEnum = ReviewStatus.PENDING;
            }
        }

        List<ReviewResponse> queue = documentReviewService.getAdminReviewQueue(statusEnum, username, documentId);
        return ResponseEntity.ok(queue);
    }

    @PostMapping("/{reviewId}/approve")
    public ResponseEntity<ReviewResponse> approveReview(
            @PathVariable Long reviewId,
            @RequestBody(required = false) ReviewActionRequest request,
            Authentication authentication) {

        String adminUsername = authentication != null ? authentication.getName() : "admin";
        String comment = request != null ? request.getComment() : null;

        ReviewResponse response = documentReviewService.approveReview(reviewId, comment, adminUsername);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{reviewId}/reject")
    public ResponseEntity<ReviewResponse> rejectReview(
            @PathVariable Long reviewId,
            @RequestBody(required = false) ReviewActionRequest request,
            Authentication authentication) {

        String adminUsername = authentication != null ? authentication.getName() : "admin";
        String comment = request != null ? request.getComment() : null;

        ReviewResponse response = documentReviewService.rejectReview(reviewId, comment, adminUsername);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{reviewId}/preview")
    public ResponseEntity<Resource> previewSubmittedVersion(
            @PathVariable Long reviewId,
            Authentication authentication) {

        String adminUsername = authentication != null ? authentication.getName() : "admin";
        VersionResourceWrapper wrapper = documentReviewService.loadSubmittedVersionFile(reviewId);

        auditService.log(adminUsername, "DOCUMENT_VERSION_PREVIEW", "DOCUMENT",
                wrapper.getVersion().getDocument().getId().toString(),
                adminUsername + " xem trước phiên bản " + wrapper.getVersion().getVersionNumber() + " trong yêu cầu xét duyệt #" + reviewId, null);

        String contentType = wrapper.getVersion().getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        String encodedFilename = URLEncoder.encode(wrapper.getVersion().getOriginalFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedFilename)
                .body(wrapper.getResource());
    }
}
