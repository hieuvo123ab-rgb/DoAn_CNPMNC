package com.edms.controller;

import com.edms.dto.ReviewResponse;
import com.edms.service.DocumentReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentReviewController {

    private final DocumentReviewService documentReviewService;

    public DocumentReviewController(DocumentReviewService documentReviewService) {
        this.documentReviewService = documentReviewService;
    }

    @PostMapping({"/{id}/review", "/{id}/reviews"})
    public ResponseEntity<ReviewResponse> submitForReview(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        ReviewResponse response = documentReviewService.submitReview(id, username, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviewHistory(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<ReviewResponse> history = documentReviewService.getReviewHistory(id, username, isAdmin);
        return ResponseEntity.ok(history);
    }
}
