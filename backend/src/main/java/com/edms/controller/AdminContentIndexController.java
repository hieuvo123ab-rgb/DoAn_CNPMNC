package com.edms.controller;

import com.edms.dto.ContentIndexRebuildResponse;
import com.edms.service.AuditService;
import com.edms.service.ContentExtractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/admin/content-index")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminContentIndexController {

    private final ContentExtractionService contentExtractionService;
    private final AuditService auditService;

    @Autowired
    public AdminContentIndexController(ContentExtractionService contentExtractionService, AuditService auditService) {
        this.contentExtractionService = contentExtractionService;
        this.auditService = auditService;
    }

    @PostMapping("/rebuild")
    public ResponseEntity<ContentIndexRebuildResponse> rebuildIndex(
            @RequestParam(value = "force", required = false, defaultValue = "false") boolean force,
            Principal principal) {
        String username = (principal != null) ? principal.getName() : "admin";
        ContentIndexRebuildResponse result = contentExtractionService.rebuildCurrentVersionIndex(force);

        auditService.log(username, "CONTENT_INDEX_REBUILD", "SYSTEM", "CONTENT_INDEX",
                String.format("Tái lập chỉ mục nội dung: total=%d, processed=%d, ready=%d, failed=%d, unsupported=%d, skipped=%d",
                        result.getTotal(), result.getProcessed(), result.getReady(), result.getFailed(), result.getUnsupported(), result.getSkipped()),
                null);

        return ResponseEntity.ok(result);
    }
}
