package com.edms.controller;

import com.edms.config.SemanticConfig;
import com.edms.entity.DocumentVersion;
import com.edms.entity.LifecycleStatus;
import com.edms.model.SemanticStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import com.edms.service.AuditService;
import com.edms.service.LocalEmbeddingService;
import com.edms.service.SemanticIndexingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.*;

/**
 * Phase 12K: Admin endpoints for semantic index management.
 * ADMIN role required for all endpoints.
 */
@RestController
@RequestMapping("/api/admin/semantic-index")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminSemanticController {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final SemanticIndexingService semanticIndexingService;
    private final LocalEmbeddingService embeddingService;
    private final SemanticConfig config;
    private final AuditService auditService;

    public AdminSemanticController(DocumentRepository documentRepository,
                                    DocumentVersionRepository documentVersionRepository,
                                    SemanticIndexingService semanticIndexingService,
                                    LocalEmbeddingService embeddingService,
                                    SemanticConfig config,
                                    AuditService auditService) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.semanticIndexingService = semanticIndexingService;
        this.embeddingService = embeddingService;
        this.config = config;
        this.auditService = auditService;
    }

    /**
     * Trigger semantic index rebuild for all eligible current versions.
     *
     * Eligible: ACTIVE or ARCHIVED documents (NOT DISPOSED).
     * force=false (default): skip versions already READY.
     * force=true: reindex everything regardless of current status.
     *
     * ADMIN only. Generates audit event.
     * Response is idempotent for force=false.
     */
    @PostMapping("/rebuild")
    public ResponseEntity<Map<String, Object>> rebuildIndex(
            @RequestParam(value = "force", required = false, defaultValue = "false") boolean force,
            Principal principal) {

        String username = principal != null ? principal.getName() : "admin";

        if (!embeddingService.isAvailable()) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "UNAVAILABLE");
            response.put("message", "Embedding model not available: " + embeddingService.getUnavailableReason());
            return ResponseEntity.ok(response);
        }

        // Find all eligible documents (ACTIVE or ARCHIVED, not DISPOSED)
        List<com.edms.entity.Document> eligibleDocs = documentRepository.findAll().stream()
                .filter(d -> d.getLifecycleStatus() == LifecycleStatus.ACTIVE
                        || d.getLifecycleStatus() == LifecycleStatus.ARCHIVED)
                .toList();

        int total = eligibleDocs.size();
        int queued = 0, skipped = 0, alreadyReady = 0;

        for (com.edms.entity.Document doc : eligibleDocs) {
            Integer currentVer = doc.getCurrentVersionNumber();
            if (currentVer == null) { skipped++; continue; }

            Optional<DocumentVersion> vOpt = documentVersionRepository
                    .findByDocumentIdAndVersionNumber(doc.getId(), currentVer);
            if (vOpt.isEmpty()) { skipped++; continue; }

            DocumentVersion v = vOpt.get();

            if (!force && v.getSemanticStatus() == SemanticStatus.READY
                    && config.getModelId().equals(v.getSemanticModel())) {
                alreadyReady++;
                continue;
            }

            // Queue synchronous rebuild (admin operation)
            try {
                semanticIndexingService.indexVersionSync(v.getId());
                queued++;
            } catch (Exception e) {
                skipped++;
            }
        }

        // Audit event
        auditService.log(username, "SEMANTIC_INDEX_REBUILD", "SYSTEM", "GLOBAL",
                "Admin triggered semantic index rebuild. force=" + force
                + ", total=" + total + ", queued=" + queued + ", skipped=" + skipped, null);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("total", total);
        response.put("eligible", total);
        response.put("queued", queued);
        response.put("ready", alreadyReady);
        response.put("failed", skipped);
        response.put("skipped", 0);
        response.put("modelId", config.getModelId());
        response.put("force", force);

        return ResponseEntity.ok(response);
    }

    /**
     * Get semantic index diagnostic status.
     * Shows per-document semantic status for current versions.
     * ADMIN only. No raw vectors or chunk text exposed.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new LinkedHashMap<>();

        // Model info
        Map<String, Object> modelInfo = new LinkedHashMap<>();
        modelInfo.put("available", embeddingService.isAvailable());
        modelInfo.put("modelId", config.getModelId());
        modelInfo.put("embeddingDimension", config.getEmbeddingDimension());
        if (!embeddingService.isAvailable()) {
            modelInfo.put("unavailableReason", embeddingService.getUnavailableReason());
        }
        response.put("semanticModel", modelInfo);

        // Config summary
        Map<String, Object> configInfo = new LinkedHashMap<>();
        configInfo.put("chunkSize", config.getChunkSize());
        configInfo.put("chunkOverlap", config.getChunkOverlap());
        configInfo.put("minScore", config.getMinScore());
        configInfo.put("topKDefault", config.getTopKDefault());
        configInfo.put("topKMax", config.getTopKMax());
        configInfo.put("hybridLexicalWeight", config.getHybridLexicalWeight());
        configInfo.put("hybridSemanticWeight", config.getHybridSemanticWeight());
        response.put("config", configInfo);

        // Document status counts
        Map<String, Long> statusCounts = new LinkedHashMap<>();
        long totalDocs = 0;
        for (SemanticStatus status : SemanticStatus.values()) {
            statusCounts.put(status.name(), 0L);
        }

        List<com.edms.entity.Document> allDocs = documentRepository.findAll();
        for (com.edms.entity.Document doc : allDocs) {
            Integer currentVer = doc.getCurrentVersionNumber();
            if (currentVer == null) continue;
            documentVersionRepository.findByDocumentIdAndVersionNumber(doc.getId(), currentVer)
                    .ifPresent(v -> {
                        SemanticStatus s = v.getSemanticStatus() != null ? v.getSemanticStatus() : SemanticStatus.PENDING;
                        statusCounts.merge(s.name(), 1L, Long::sum);
                    });
            totalDocs++;
        }
        response.put("totalDocuments", totalDocs);
        response.put("statusCounts", statusCounts);

        return ResponseEntity.ok(response);
    }
}
