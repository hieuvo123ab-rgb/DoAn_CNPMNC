package com.edms.controller;

import com.edms.dto.DispositionDecisionDto;
import com.edms.dto.DispositionResponseDto;
import com.edms.service.DocumentDispositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dispositions")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminDispositionController {

    private final DocumentDispositionService documentDispositionService;

    public AdminDispositionController(DocumentDispositionService documentDispositionService) {
        this.documentDispositionService = documentDispositionService;
    }

    private boolean checkIsAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<List<DispositionResponseDto>> getDispositionQueue(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        boolean isAdmin = checkIsAdmin(authentication);
        List<DispositionResponseDto> queue = documentDispositionService.getAdminDispositionQueue(status, isAdmin);
        return ResponseEntity.ok(queue);
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<DispositionResponseDto> approveDisposition(
            @PathVariable Long requestId,
            @RequestBody(required = false) DispositionDecisionDto decision,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        boolean isAdmin = checkIsAdmin(authentication);
        String comment = decision != null ? decision.getComment() : null;
        DispositionResponseDto response = documentDispositionService.approveDisposition(requestId, comment, adminUsername, isAdmin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<DispositionResponseDto> rejectDisposition(
            @PathVariable Long requestId,
            @RequestBody(required = false) DispositionDecisionDto decision,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        boolean isAdmin = checkIsAdmin(authentication);
        String comment = decision != null ? decision.getComment() : null;
        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Lý do từ chối yêu cầu tiêu hủy (comment) là bắt buộc");
        }
        DispositionResponseDto response = documentDispositionService.rejectDisposition(requestId, comment, adminUsername, isAdmin);
        return ResponseEntity.ok(response);
    }
}
