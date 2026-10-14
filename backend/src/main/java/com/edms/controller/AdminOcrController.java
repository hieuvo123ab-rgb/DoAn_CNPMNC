package com.edms.controller;

import com.edms.dto.OcrIndexRebuildResponse;
import com.edms.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ocr")
public class AdminOcrController {

    private final OcrService ocrService;

    @Autowired
    public AdminOcrController(OcrService ocrService) {
        this.ocrService = ocrService;
    }

    @PostMapping("/rebuild")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<OcrIndexRebuildResponse> rebuildOcrIndex(
            @RequestParam(value = "force", defaultValue = "false") boolean force,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        OcrIndexRebuildResponse response = ocrService.rebuildOcrIndex(force, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/retry/{versionId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> retryOcr(
            @PathVariable("versionId") Long versionId,
            @RequestParam(value = "sync", defaultValue = "false") boolean sync,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        boolean queued = ocrService.retryOcr(versionId, sync, username);
        return ResponseEntity.ok(java.util.Map.of("versionId", versionId, "queued", queued));
    }
}
