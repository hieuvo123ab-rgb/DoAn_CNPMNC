package com.edms.controller;

import com.edms.dto.*;
import com.edms.entity.InvestigationReason;
import com.edms.entity.InvestigationSeverity;
import com.edms.entity.InvestigationStatus;
import com.edms.service.InvestigationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investigations")
public class InvestigationController {

    private final InvestigationService investigationService;

    public InvestigationController(InvestigationService investigationService) {
        this.investigationService = investigationService;
    }

    @GetMapping
    public ResponseEntity<List<InvestigationCaseResponse>> listCases(
            @RequestParam(value = "status", required = false) InvestigationStatus status,
            @RequestParam(value = "severity", required = false) InvestigationSeverity severity,
            @RequestParam(value = "assignedTo", required = false) String assignedTo,
            @RequestParam(value = "search", required = false) String search) {
        List<InvestigationCaseResponse> list = investigationService.listCases(status, severity, assignedTo, search);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/summary")
    public ResponseEntity<InvestigationSummaryDto> getSummary() {
        return ResponseEntity.ok(investigationService.getSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestigationCaseResponse> getCaseById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(investigationService.getCaseById(id));
    }

    @PostMapping
    public ResponseEntity<InvestigationCaseResponse> createCase(
            @Valid @RequestBody InvestigationCaseCreateRequest request,
            Authentication authentication) {
        InvestigationCaseResponse created = investigationService.createCase(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestigationCaseResponse> updateCase(
            @PathVariable("id") Long id,
            @Valid @RequestBody InvestigationCaseUpdateRequest request,
            Authentication authentication) {
        InvestigationCaseResponse updated = investigationService.updateCase(id, request, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<InvestigationCaseResponse> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody InvestigationStatusUpdateRequest request,
            Authentication authentication) {
        InvestigationCaseResponse updated = investigationService.updateStatus(id, request, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<List<InvestigationEvidenceResponse>> listEvidence(@PathVariable("id") Long id) {
        return ResponseEntity.ok(investigationService.listEvidence(id));
    }

    @PostMapping("/{id}/evidence")
    public ResponseEntity<InvestigationEvidenceResponse> preserveEvidence(
            @PathVariable("id") Long id,
            @Valid @RequestBody InvestigationEvidencePreserveRequest request,
            Authentication authentication) {
        InvestigationEvidenceResponse response = investigationService.preserveEvidence(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/diff")
    public ResponseEntity<InvestigationVersionDiffResponse> computeDiff(
            @RequestParam("documentId") Long documentId,
            @RequestParam("versionA") Integer versionA,
            @RequestParam("versionB") Integer versionB) {
        InvestigationVersionDiffResponse diff = investigationService.computeVersionDiff(documentId, versionA, versionB);
        return ResponseEntity.ok(diff);
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<InvestigationEventResponse>> getTimeline(@PathVariable("id") Long id) {
        return ResponseEntity.ok(investigationService.getTimeline(id));
    }

    @GetMapping("/{id}/findings")
    public ResponseEntity<List<InvestigationFindingResponse>> listFindings(@PathVariable("id") Long id) {
        return ResponseEntity.ok(investigationService.listFindings(id));
    }

    @PostMapping("/{id}/findings")
    public ResponseEntity<InvestigationFindingResponse> addFinding(
            @PathVariable("id") Long id,
            @Valid @RequestBody InvestigationFindingRequest request,
            Authentication authentication) {
        InvestigationFindingResponse finding = investigationService.addFinding(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(finding);
    }

    @PostMapping("/{id}/conclusion")
    public ResponseEntity<InvestigationCaseResponse> submitConclusion(
            @PathVariable("id") Long id,
            @Valid @RequestBody InvestigationConclusionRequest request,
            Authentication authentication) {
        InvestigationCaseResponse res = investigationService.submitConclusion(id, request, authentication.getName());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<InvestigationCaseResponse> approveConclusion(
            @PathVariable("id") Long id,
            Authentication authentication) {
        if (!isAdmin(authentication)) {
            throw new AccessDeniedException("Chỉ Quản trị viên (ROLE_ADMIN) mới có quyền phê duyệt kết luận điều tra");
        }
        InvestigationCaseResponse res = investigationService.approveConclusion(id, authentication.getName());
        return ResponseEntity.ok(res);
    }

    public static class CreateFromVdrRequest {
        private Long vdrEventId;
        private String assignedTo;
        private String title;

        public Long getVdrEventId() {
            return vdrEventId;
        }

        public void setVdrEventId(Long vdrEventId) {
            this.vdrEventId = vdrEventId;
        }

        public String getAssignedTo() {
            return assignedTo;
        }

        public void setAssignedTo(String assignedTo) {
            this.assignedTo = assignedTo;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }
    }

    @PostMapping("/from-vdr-event")
    public ResponseEntity<InvestigationCaseResponse> createFromVdrEvent(
            @RequestBody CreateFromVdrRequest req,
            Authentication authentication) {
        InvestigationCaseResponse res = investigationService.createCaseFromVdrEvent(
                req.getVdrEventId(), req.getAssignedTo(), req.getTitle(), authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/{id}/export-manifest")
    public ResponseEntity<Map<String, Object>> exportManifest(@PathVariable("id") Long id) {
        Map<String, Object> manifest = investigationService.exportManifest(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"manifest-inv-" + id + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(manifest);
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
