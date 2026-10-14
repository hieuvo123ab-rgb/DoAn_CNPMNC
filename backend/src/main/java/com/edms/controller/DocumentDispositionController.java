package com.edms.controller;

import com.edms.dto.DispositionRequestDto;
import com.edms.dto.DispositionResponseDto;
import com.edms.service.DocumentDispositionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentDispositionController {

    private final DocumentDispositionService documentDispositionService;

    public DocumentDispositionController(DocumentDispositionService documentDispositionService) {
        this.documentDispositionService = documentDispositionService;
    }

    private boolean checkIsAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping("/{id}/disposition")
    public ResponseEntity<DispositionResponseDto> requestDisposition(
            @PathVariable Long id,
            @Valid @RequestBody DispositionRequestDto request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        boolean isAdmin = checkIsAdmin(authentication);
        DispositionResponseDto response = documentDispositionService.requestDisposition(id, request.getReason(), username, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/disposition/cancel")
    public ResponseEntity<DispositionResponseDto> cancelDisposition(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        boolean isAdmin = checkIsAdmin(authentication);
        DispositionResponseDto response = documentDispositionService.cancelDisposition(id, username, isAdmin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/dispositions")
    public ResponseEntity<List<DispositionResponseDto>> getDispositionHistory(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        boolean isAdmin = checkIsAdmin(authentication);
        List<DispositionResponseDto> history = documentDispositionService.getDispositionHistory(id, username, isAdmin);
        return ResponseEntity.ok(history);
    }
}
