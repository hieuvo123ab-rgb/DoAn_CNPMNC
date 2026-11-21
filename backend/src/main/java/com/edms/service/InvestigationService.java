package com.edms.service;

import com.edms.dto.*;
import com.edms.entity.*;
import com.edms.exception.ResourceNotFoundException;
import com.edms.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InvestigationService {

    private static final Logger log = LoggerFactory.getLogger(InvestigationService.class);

    private final InvestigationCaseRepository caseRepository;
    private final InvestigationEvidenceRepository evidenceRepository;
    private final InvestigationEventRepository eventRepository;
    private final InvestigationFindingRepository findingRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final DataRoomEventRepository dataRoomEventRepository;
    private final FileStorageService fileStorageService;

    public InvestigationService(InvestigationCaseRepository caseRepository,
                                InvestigationEvidenceRepository evidenceRepository,
                                InvestigationEventRepository eventRepository,
                                InvestigationFindingRepository findingRepository,
                                DocumentRepository documentRepository,
                                DocumentVersionRepository versionRepository,
                                AuditLogRepository auditLogRepository,
                                UserRepository userRepository,
                                DataRoomEventRepository dataRoomEventRepository,
                                FileStorageService fileStorageService) {
        this.caseRepository = caseRepository;
        this.evidenceRepository = evidenceRepository;
        this.eventRepository = eventRepository;
        this.findingRepository = findingRepository;
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.dataRoomEventRepository = dataRoomEventRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public synchronized String generateNextCaseNumber() {
        int currentYear = Year.now().getValue();
        String prefix = "INV-" + currentYear + "-";
        long count = caseRepository.count() + 1;
        String candidate;
        int attempt = 0;
        do {
            candidate = String.format("%s%04d", prefix, count + attempt);
            attempt++;
        } while (caseRepository.existsByCaseNumber(candidate));
        return candidate;
    }

    @Transactional(readOnly = true)
    public List<InvestigationCaseResponse> listCases(InvestigationStatus status,
                                                    InvestigationSeverity severity,
                                                    String assignedTo,
                                                    String search) {
        List<InvestigationCase> cases = caseRepository.findAll();

        return cases.stream()
                .filter(c -> status == null || c.getStatus() == status)
                .filter(c -> severity == null || c.getSeverity() == severity)
                .filter(c -> assignedTo == null || assignedTo.isBlank() || assignedTo.equalsIgnoreCase(c.getAssignedTo()))
                .filter(c -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    return c.getCaseNumber().toLowerCase().contains(s)
                            || c.getTitle().toLowerCase().contains(s)
                            || (c.getDescription() != null && c.getDescription().toLowerCase().contains(s))
                            || (c.getTargetDocumentTitle() != null && c.getTargetDocumentTitle().toLowerCase().contains(s));
                })
                .sorted(Comparator.comparing(InvestigationCase::getCreatedAt).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvestigationSummaryDto getSummary() {
        InvestigationSummaryDto summary = new InvestigationSummaryDto();
        summary.setTotal(caseRepository.count());
        summary.setOpen(caseRepository.countByStatus(InvestigationStatus.OPEN));
        summary.setInvestigating(caseRepository.countByStatus(InvestigationStatus.INVESTIGATING));
        summary.setReviewPending(caseRepository.countByStatus(InvestigationStatus.REVIEW_PENDING));
        summary.setClosed(caseRepository.countByStatus(InvestigationStatus.CLOSED));
        summary.setReopened(caseRepository.countByStatus(InvestigationStatus.REOPENED));
        summary.setCritical(caseRepository.countBySeverity(InvestigationSeverity.CRITICAL));

        long overdue = caseRepository.findAll().stream().filter(InvestigationCase::isOverdue).count();
        summary.setOverdue(overdue);
        return summary;
    }

    @Transactional(readOnly = true)
    public InvestigationCaseResponse getCaseById(Long id) {
        InvestigationCase c = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra với ID: " + id));
        return mapToResponse(c);
    }

    @Transactional
    public InvestigationCaseResponse createCase(InvestigationCaseCreateRequest request, String currentUser) {
        InvestigationCase c = new InvestigationCase();
        c.setCaseNumber(generateNextCaseNumber());
        c.setTitle(request.getTitle());
        c.setDescription(request.getDescription());
        c.setReason(request.getReason() != null ? request.getReason() : InvestigationReason.OTHER);
        c.setSeverity(request.getSeverity() != null ? request.getSeverity() : InvestigationSeverity.MEDIUM);
        c.setStatus(InvestigationStatus.OPEN);
        c.setAssignedTo(request.getAssignedTo());
        c.setCreatedBy(currentUser);
        c.setDueDate(request.getDueDate());
        c.setVdrEventId(request.getVdrEventId());

        userRepository.findByUsername(request.getAssignedTo()).ifPresent(u ->
                c.setAssignedToFullName(u.getFullName())
        );

        if (request.getTargetDocumentId() != null) {
            documentRepository.findById(request.getTargetDocumentId()).ifPresent(doc -> {
                c.setTargetDocumentId(doc.getId());
                c.setTargetDocumentTitle(doc.getTitle());
            });
        }

        InvestigationCase saved = caseRepository.save(c);

        // Record initial event
        InvestigationEvent evt = new InvestigationEvent(
                saved.getId(),
                "CASE_CREATED",
                "Khởi tạo hồ sơ điều tra mới #" + saved.getCaseNumber() + " bởi " + currentUser,
                currentUser,
                "SYSTEM"
        );
        eventRepository.save(evt);

        // If target document provided, automatically preserve its latest version as initial evidence
        if (saved.getTargetDocumentId() != null) {
            try {
                autoPreserveInitialEvidence(saved, currentUser);
            } catch (Exception ex) {
                log.warn("Could not auto preserve initial evidence: {}", ex.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    private void autoPreserveInitialEvidence(InvestigationCase c, String currentUser) {
        List<DocumentVersion> versions = versionRepository.findByDocumentIdOrderByVersionNumberDesc(c.getTargetDocumentId());
        if (!versions.isEmpty()) {
            DocumentVersion latest = versions.get(0);
            InvestigationEvidence ev = new InvestigationEvidence();
            ev.setCaseId(c.getId());
            ev.setDocumentId(c.getTargetDocumentId());
            ev.setVersionNumber(latest.getVersionNumber());
            ev.setOriginalFileName(latest.getOriginalFileName());
            ev.setStoredFileName(latest.getStoredFileName());
            ev.setContentType(latest.getContentType());
            ev.setFileSize(latest.getFileSize());
            ev.setFileHash(latest.getFileHash() != null ? latest.getFileHash() : "sha256:unknown");
            ev.setLegalHoldApplied(false);
            ev.setCollectedBy(currentUser);
            ev.setCollectedAt(Instant.now());
            ev.setNotes("Tự động trích xuất phiên bản hiện tại v" + latest.getVersionNumber() + " khi mở hồ sơ");
            evidenceRepository.save(ev);
        }
    }

    @Transactional
    public InvestigationCaseResponse updateCase(Long id, InvestigationCaseUpdateRequest request, String currentUser) {
        InvestigationCase c = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            c.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            c.setDescription(request.getDescription());
        }
        if (request.getSeverity() != null) {
            c.setSeverity(request.getSeverity());
        }
        if (request.getAssignedTo() != null && !request.getAssignedTo().isBlank()) {
            c.setAssignedTo(request.getAssignedTo());
            userRepository.findByUsername(request.getAssignedTo()).ifPresent(u ->
                    c.setAssignedToFullName(u.getFullName())
            );
        }
        if (request.getDueDate() != null) {
            c.setDueDate(request.getDueDate());
        }

        InvestigationCase updated = caseRepository.save(c);

        InvestigationEvent evt = new InvestigationEvent(
                updated.getId(),
                "CASE_UPDATED",
                "Cập nhật thông tin hồ sơ điều tra bởi " + currentUser,
                currentUser,
                "INVESTIGATION"
        );
        eventRepository.save(evt);

        return mapToResponse(updated);
    }

    @Transactional
    public InvestigationCaseResponse updateStatus(Long id, InvestigationStatusUpdateRequest request, String currentUser) {
        InvestigationCase c = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        InvestigationStatus oldStatus = c.getStatus();
        InvestigationStatus newStatus = request.getStatus();

        if (oldStatus == newStatus) {
            return mapToResponse(c);
        }

        // Validate state transitions
        if (oldStatus == InvestigationStatus.CLOSED && newStatus != InvestigationStatus.REOPENED) {
            throw new IllegalStateException("Hồ sơ đã đóng chỉ có thể mở lại (REOPENED)");
        }

        c.setStatus(newStatus);
        if (newStatus == InvestigationStatus.CLOSED) {
            c.setClosedAt(Instant.now());
            if (c.getConclusionApprovedBy() == null) {
                c.setConclusionApprovedBy(currentUser);
            }
        }

        InvestigationCase updated = caseRepository.save(c);

        String noteStr = (request.getNote() != null && !request.getNote().isBlank()) ? (" - Ghi chú: " + request.getNote()) : "";
        InvestigationEvent evt = new InvestigationEvent(
                updated.getId(),
                "STATUS_CHANGED",
                "Chuyển trạng thái từ " + oldStatus + " sang " + newStatus + noteStr,
                currentUser,
                "WORKFLOW"
        );
        eventRepository.save(evt);

        return mapToResponse(updated);
    }

    @Transactional
    public InvestigationEvidenceResponse preserveEvidence(Long caseId, InvestigationEvidencePreserveRequest request, String currentUser) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        Document doc = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu ID: " + request.getDocumentId()));

        DocumentVersion version = versionRepository.findByDocumentIdAndVersionNumber(request.getDocumentId(), request.getVersionNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản v" + request.getVersionNumber() + " của tài liệu"));

        // Apply Legal Hold if requested
        if (request.isApplyLegalHold()) {
            doc.setLegalHold(true);
            doc.setLegalHoldReason("Hồ sơ điều tra #" + c.getCaseNumber() + ": " + (request.getNotes() != null ? request.getNotes() : "Bảo toàn chứng cứ"));
            doc.setLegalHoldSetAt(Instant.now());
            doc.setLegalHoldSetBy(currentUser);
            documentRepository.save(doc);
        }

        InvestigationEvidence ev = new InvestigationEvidence();
        ev.setCaseId(c.getId());
        ev.setDocumentId(doc.getId());
        ev.setVersionNumber(version.getVersionNumber());
        ev.setOriginalFileName(version.getOriginalFileName());
        ev.setStoredFileName(version.getStoredFileName());
        ev.setContentType(version.getContentType());
        ev.setFileSize(version.getFileSize());
        ev.setFileHash(version.getFileHash() != null ? version.getFileHash() : "sha256:unknown");
        ev.setLegalHoldApplied(request.isApplyLegalHold());
        ev.setCollectedBy(currentUser);
        ev.setCollectedAt(Instant.now());
        ev.setNotes(request.getNotes());

        InvestigationEvidence saved = evidenceRepository.save(ev);

        // Record event
        String legalHoldMsg = request.isApplyLegalHold() ? " (Đã kích hoạt Legal Hold ngăn tiêu hủy)" : "";
        InvestigationEvent evt = new InvestigationEvent(
                c.getId(),
                "EVIDENCE_PRESERVED",
                "Bảo toàn chứng cứ tài liệu '" + doc.getTitle() + "' phiên bản v" + version.getVersionNumber()
                        + " với SHA-256: " + ev.getFileHash() + legalHoldMsg,
                currentUser,
                "EVIDENCE"
        );
        eventRepository.save(evt);

        // Update case status to INVESTIGATING if currently OPEN
        if (c.getStatus() == InvestigationStatus.OPEN) {
            c.setStatus(InvestigationStatus.INVESTIGATING);
            caseRepository.save(c);
        }

        return mapToEvidenceResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<InvestigationEvidenceResponse> listEvidence(Long caseId) {
        return evidenceRepository.findByCaseIdOrderByCollectedAtDesc(caseId).stream()
                .map(this::mapToEvidenceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvestigationVersionDiffResponse computeVersionDiff(Long documentId, Integer versionA, Integer versionB) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu ID: " + documentId));

        DocumentVersion vA = versionRepository.findByDocumentIdAndVersionNumber(documentId, versionA)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản v" + versionA));

        DocumentVersion vB = versionRepository.findByDocumentIdAndVersionNumber(documentId, versionB)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản v" + versionB));

        InvestigationVersionDiffResponse response = new InvestigationVersionDiffResponse();
        response.setDocumentId(doc.getId());
        response.setDocumentTitle(doc.getTitle());
        response.setVersionA(vA.getVersionNumber());
        response.setVersionB(vB.getVersionNumber());
        response.setHashA(vA.getFileHash());
        response.setHashB(vB.getFileHash());
        response.setHashMatch(vA.getFileHash() != null && vA.getFileHash().equalsIgnoreCase(vB.getFileHash()));
        response.setCreatedAtA(vA.getCreatedAt());
        response.setCreatedAtB(vB.getCreatedAt());
        response.setCreatedByA(vA.getUploadedBy());
        response.setCreatedByB(vB.getUploadedBy());
        response.setFileSizeA(vA.getFileSize());
        response.setFileSizeB(vB.getFileSize());
        response.setFileNameA(vA.getOriginalFileName());
        response.setFileNameB(vB.getOriginalFileName());

        // Metadata diff map
        Map<String, Object> metaDiff = new HashMap<>();
        metaDiff.put("fileNameDiffers", !Objects.equals(vA.getOriginalFileName(), vB.getOriginalFileName()));
        metaDiff.put("sizeDifferenceBytes", vB.getFileSize() - vA.getFileSize());
        metaDiff.put("contentTypeA", vA.getContentType());
        metaDiff.put("contentTypeB", vB.getContentType());
        response.setMetaDiff(metaDiff);

        // Textual content comparison
        String textA = resolveVersionText(vA);
        String textB = resolveVersionText(vB);

        List<InvestigationVersionDiffResponse.DiffLine> diffLines = computeLineDiff(textA, textB);
        response.setDiffLines(diffLines);

        return response;
    }

    private String resolveVersionText(DocumentVersion v) {
        if (v.getExtractedText() != null && !v.getExtractedText().isBlank()) {
            return v.getExtractedText();
        }
        if (v.getOcrText() != null && !v.getOcrText().isBlank()) {
            return v.getOcrText();
        }
        // Fallback: if plain text file, read from storage
        try {
            if (v.getContentType() != null && v.getContentType().contains("text")) {
                Resource resource = fileStorageService.loadFileAsResource(v.getStoredFileName());
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                    return reader.lines().collect(Collectors.joining("\n"));
                }
            }
        } catch (Exception ex) {
            log.debug("Could not read text from file: {}", ex.getMessage());
        }
        return "[Không có dữ liệu văn bản trích xuất cho phiên bản này. Định dạng: " + v.getContentType() + ", Kích thước: " + v.getFileSize() + " bytes]";
    }

    private List<InvestigationVersionDiffResponse.DiffLine> computeLineDiff(String textA, String textB) {
        List<String> linesA = Arrays.asList(textA.split("\\r?\\n"));
        List<String> linesB = Arrays.asList(textB.split("\\r?\\n"));

        List<InvestigationVersionDiffResponse.DiffLine> result = new ArrayList<>();

        int[][] dp = new int[linesA.size() + 1][linesB.size() + 1];
        for (int i = 0; i < linesA.size(); i++) {
            for (int j = 0; j < linesB.size(); j++) {
                if (linesA.get(i).equals(linesB.get(j))) {
                    dp[i + 1][j + 1] = dp[i][j] + 1;
                } else {
                    dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
        }

        int i = linesA.size();
        int j = linesB.size();
        LinkedList<InvestigationVersionDiffResponse.DiffLine> stack = new LinkedList<>();

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && linesA.get(i - 1).equals(linesB.get(j - 1))) {
                stack.addFirst(new InvestigationVersionDiffResponse.DiffLine("EQUAL", i, j, linesA.get(i - 1)));
                i--;
                j--;
            } else if (j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                stack.addFirst(new InvestigationVersionDiffResponse.DiffLine("INSERT", null, j, linesB.get(j - 1)));
                j--;
            } else if (i > 0 && (j == 0 || dp[i][j - 1] < dp[i - 1][j])) {
                stack.addFirst(new InvestigationVersionDiffResponse.DiffLine("DELETE", i, null, linesA.get(i - 1)));
                i--;
            }
        }

        result.addAll(stack);
        return result;
    }

    @Transactional(readOnly = true)
    public List<InvestigationEventResponse> getTimeline(Long caseId) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        List<InvestigationEvent> caseEvents = eventRepository.findByCaseIdOrderByTimestampAsc(caseId);
        List<InvestigationEventResponse> timeline = new ArrayList<>();

        for (InvestigationEvent e : caseEvents) {
            InvestigationEventResponse res = new InvestigationEventResponse();
            res.setId(e.getId());
            res.setCaseId(e.getCaseId());
            res.setEventType(e.getEventType());
            res.setDescription(e.getDescription());
            res.setActor(e.getActor());
            res.setSource(e.getSource() != null ? e.getSource() : "INVESTIGATION");
            res.setTimestamp(e.getTimestamp());
            timeline.add(res);
        }

        // Pull document audit logs if target document exists
        if (c.getTargetDocumentId() != null) {
            List<AuditLog> auditLogs = auditLogRepository.findByResourceTypeAndResourceIdOrderByTimestampAsc(
                    "DOCUMENT", String.valueOf(c.getTargetDocumentId())
            );
            for (AuditLog a : auditLogs) {
                InvestigationEventResponse res = new InvestigationEventResponse();
                res.setId(-a.getId());
                res.setCaseId(c.getId());
                res.setEventType("AUDIT_" + a.getAction());
                res.setDescription(a.getDescription() != null ? a.getDescription() : ("Thao tác tài liệu: " + a.getAction()));
                res.setActor(a.getUsername());
                res.setSource("DOCUMENT_AUDIT");
                res.setTimestamp(a.getTimestamp());
                timeline.add(res);
            }
        }

        timeline.sort(Comparator.comparing(InvestigationEventResponse::getTimestamp));
        return timeline;
    }

    @Transactional
    public InvestigationFindingResponse addFinding(Long caseId, InvestigationFindingRequest request, String currentUser) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        InvestigationFinding finding = new InvestigationFinding(
                c.getId(),
                request.getTitle(),
                request.getDetails(),
                request.getCategory(),
                currentUser
        );
        InvestigationFinding saved = findingRepository.save(finding);

        InvestigationEvent evt = new InvestigationEvent(
                c.getId(),
                "FINDING_RECORDED",
                "Ghi nhận phát hiện điều tra: '" + saved.getTitle() + "' bởi " + currentUser,
                currentUser,
                "INVESTIGATION"
        );
        eventRepository.save(evt);

        return mapToFindingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<InvestigationFindingResponse> listFindings(Long caseId) {
        return findingRepository.findByCaseIdOrderByCreatedAtAsc(caseId).stream()
                .map(this::mapToFindingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvestigationCaseResponse submitConclusion(Long caseId, InvestigationConclusionRequest request, String currentUser) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        c.setConclusion(request.getConclusion());
        c.setConclusionSubmittedAt(Instant.now());
        c.setStatus(InvestigationStatus.REVIEW_PENDING);

        InvestigationCase saved = caseRepository.save(c);

        InvestigationEvent evt = new InvestigationEvent(
                c.getId(),
                "CONCLUSION_SUBMITTED",
                "Trình kết luận điều tra sang cấp xét duyệt bởi " + currentUser,
                currentUser,
                "WORKFLOW"
        );
        eventRepository.save(evt);

        return mapToResponse(saved);
    }

    @Transactional
    public InvestigationCaseResponse approveConclusion(Long caseId, String currentUser) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        if (c.getConclusion() == null || c.getConclusion().isBlank()) {
            throw new IllegalStateException("Hồ sơ chưa có kết luận để phê duyệt");
        }

        c.setConclusionApprovedBy(currentUser);
        c.setStatus(InvestigationStatus.CLOSED);
        c.setClosedAt(Instant.now());

        InvestigationCase saved = caseRepository.save(c);

        InvestigationEvent evt = new InvestigationEvent(
                c.getId(),
                "CONCLUSION_APPROVED",
                "Phê duyệt kết luận điều tra và chính thức đóng hồ sơ bởi " + currentUser,
                currentUser,
                "ADMIN"
        );
        eventRepository.save(evt);

        return mapToResponse(saved);
    }

    @Transactional
    public InvestigationCaseResponse createCaseFromVdrEvent(Long vdrEventId, String assignedTo, String title, String currentUser) {
        DataRoomEvent event = dataRoomEventRepository.findById(vdrEventId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện VDR ID: " + vdrEventId));

        InvestigationCase c = new InvestigationCase();
        c.setCaseNumber(generateNextCaseNumber());
        c.setTitle(title != null && !title.isBlank() ? title : ("Điều tra sự cố bảo mật VDR #" + event.getId() + " (" + event.getEventType() + ")"));
        c.setDescription("Khởi tạo tự động từ sự cố bảo mật Virtual Data Room.\n"
                + "Loại sự kiện: " + event.getEventType() + "\n"
                + "Người thực hiện: " + event.getUsername() + " (" + event.getEmail() + ")\n"
                + "IP: " + event.getIpAddress() + "\n"
                + "Chi tiết: " + event.getDescription());
        c.setReason(InvestigationReason.VDR_SECURITY_ALERT);
        c.setSeverity(event.isSuspicious() ? InvestigationSeverity.HIGH : InvestigationSeverity.MEDIUM);
        c.setStatus(InvestigationStatus.OPEN);
        c.setAssignedTo(assignedTo != null && !assignedTo.isBlank() ? assignedTo : currentUser);
        c.setCreatedBy(currentUser);
        c.setVdrEventId(event.getId());
        c.setTargetDocumentId(event.getDocumentId());

        if (event.getDocumentId() != null) {
            documentRepository.findById(event.getDocumentId()).ifPresent(doc ->
                    c.setTargetDocumentTitle(doc.getTitle())
            );
        }

        userRepository.findByUsername(c.getAssignedTo()).ifPresent(u ->
                c.setAssignedToFullName(u.getFullName())
        );

        InvestigationCase saved = caseRepository.save(c);

        // Update vdr event reference
        event.setInvestigationCaseId(saved.getId());
        dataRoomEventRepository.save(event);

        InvestigationEvent evt = new InvestigationEvent(
                saved.getId(),
                "VDR_CASE_LINKED",
                "Hồ sơ điều tra được liên kết tự động từ sự cố VDR #" + event.getId(),
                currentUser,
                "INTEGRATION"
        );
        eventRepository.save(evt);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportManifest(Long caseId) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ điều tra"));

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("manifestVersion", "1.0");
        manifest.put("system", "EDMS Enterprise Investigation Subsystem");
        manifest.put("exportedAt", Instant.now().toString());

        Map<String, Object> caseData = new LinkedHashMap<>();
        caseData.put("caseNumber", c.getCaseNumber());
        caseData.put("title", c.getTitle());
        caseData.put("reason", c.getReason().name());
        caseData.put("severity", c.getSeverity().name());
        caseData.put("status", c.getStatus().name());
        caseData.put("assignedTo", c.getAssignedTo());
        caseData.put("createdBy", c.getCreatedBy());
        caseData.put("createdAt", c.getCreatedAt().toString());
        caseData.put("closedAt", c.getClosedAt() != null ? c.getClosedAt().toString() : null);
        caseData.put("targetDocumentId", c.getTargetDocumentId());
        caseData.put("targetDocumentTitle", c.getTargetDocumentTitle());
        caseData.put("conclusion", c.getConclusion());
        caseData.put("conclusionApprovedBy", c.getConclusionApprovedBy());
        manifest.put("caseDetails", caseData);

        manifest.put("evidences", evidenceRepository.findByCaseIdOrderByCollectedAtDesc(caseId));
        manifest.put("findings", findingRepository.findByCaseIdOrderByCreatedAtAsc(caseId));
        manifest.put("events", eventRepository.findByCaseIdOrderByTimestampAsc(caseId));

        return manifest;
    }

    private InvestigationCaseResponse mapToResponse(InvestigationCase c) {
        InvestigationCaseResponse r = new InvestigationCaseResponse();
        r.setId(c.getId());
        r.setCaseNumber(c.getCaseNumber());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setReason(c.getReason());
        r.setSeverity(c.getSeverity());
        r.setStatus(c.getStatus());
        r.setAssignedTo(c.getAssignedTo());
        r.setAssignedToFullName(c.getAssignedToFullName());
        r.setCreatedBy(c.getCreatedBy());
        r.setDueDate(c.getDueDate());
        r.setOverdue(c.isOverdue());
        r.setTargetDocumentId(c.getTargetDocumentId());
        r.setTargetDocumentTitle(c.getTargetDocumentTitle());
        r.setVdrEventId(c.getVdrEventId());
        r.setConclusion(c.getConclusion());
        r.setConclusionSubmittedAt(c.getConclusionSubmittedAt());
        r.setConclusionApprovedBy(c.getConclusionApprovedBy());
        r.setClosedAt(c.getClosedAt());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());

        r.setEvidenceCount((int) evidenceRepository.countByCaseId(c.getId()));
        r.setFindingsCount((int) findingRepository.countByCaseId(c.getId()));
        r.setEventsCount((int) eventRepository.countByCaseId(c.getId()));
        return r;
    }

    private InvestigationEvidenceResponse mapToEvidenceResponse(InvestigationEvidence e) {
        InvestigationEvidenceResponse r = new InvestigationEvidenceResponse();
        r.setId(e.getId());
        r.setCaseId(e.getCaseId());
        r.setDocumentId(e.getDocumentId());
        r.setVersionNumber(e.getVersionNumber());
        r.setOriginalFileName(e.getOriginalFileName());
        r.setStoredFileName(e.getStoredFileName());
        r.setContentType(e.getContentType());
        r.setFileSize(e.getFileSize());
        r.setFileHash(e.getFileHash());
        r.setLegalHoldApplied(e.isLegalHoldApplied());
        r.setCollectedBy(e.getCollectedBy());
        r.setCollectedAt(e.getCollectedAt());
        r.setNotes(e.getNotes());
        return r;
    }

    private InvestigationFindingResponse mapToFindingResponse(InvestigationFinding f) {
        InvestigationFindingResponse r = new InvestigationFindingResponse();
        r.setId(f.getId());
        r.setCaseId(f.getCaseId());
        r.setTitle(f.getTitle());
        r.setDetails(f.getDetails());
        r.setCategory(f.getCategory());
        r.setReportedBy(f.getReportedBy());
        r.setCreatedAt(f.getCreatedAt());
        return r;
    }
}
