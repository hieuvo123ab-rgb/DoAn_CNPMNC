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

import java.time.Instant;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VirtualDataRoomService {

    private static final Logger log = LoggerFactory.getLogger(VirtualDataRoomService.class);

    private final DataRoomRepository roomRepository;
    private final DataRoomDocumentRepository roomDocumentRepository;
    private final DataRoomMemberRepository roomMemberRepository;
    private final DataRoomInvitationRepository roomInvitationRepository;
    private final DataRoomEventRepository roomEventRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final WatermarkService watermarkService;

    public VirtualDataRoomService(DataRoomRepository roomRepository,
                                  DataRoomDocumentRepository roomDocumentRepository,
                                  DataRoomMemberRepository roomMemberRepository,
                                  DataRoomInvitationRepository roomInvitationRepository,
                                  DataRoomEventRepository roomEventRepository,
                                  DocumentRepository documentRepository,
                                  DocumentVersionRepository versionRepository,
                                  UserRepository userRepository,
                                  FileStorageService fileStorageService,
                                  WatermarkService watermarkService) {
        this.roomRepository = roomRepository;
        this.roomDocumentRepository = roomDocumentRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomInvitationRepository = roomInvitationRepository;
        this.roomEventRepository = roomEventRepository;
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.watermarkService = watermarkService;
    }

    @Transactional
    public synchronized String generateNextRoomCode() {
        int currentYear = Year.now().getValue();
        String prefix = "VDR-" + currentYear + "-";
        long count = roomRepository.count() + 1;
        String candidate;
        int attempt = 0;
        do {
            candidate = String.format("%s%03d", prefix, count + attempt);
            attempt++;
        } while (roomRepository.existsByRoomCode(candidate));
        return candidate;
    }

    @Transactional(readOnly = true)
    public List<DataRoomResponse> listRooms(String currentUser, boolean isAdmin) {
        List<DataRoom> rooms = roomRepository.findAll();

        return rooms.stream()
                .filter(r -> {
                    if (isAdmin || r.getOwnerUsername().equalsIgnoreCase(currentUser)) return true;
                    // Check if member
                    return roomMemberRepository.findByRoomIdAndUsername(r.getId(), currentUser)
                            .map(DataRoomMember::isActive)
                            .orElse(false);
                })
                .sorted(Comparator.comparing(DataRoom::getCreatedAt).reversed())
                .map(r -> mapToResponse(r, currentUser, isAdmin))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DataRoomSummaryDto getSummary(String currentUser, boolean isAdmin) {
        DataRoomSummaryDto s = new DataRoomSummaryDto();
        s.setTotalRooms(roomRepository.count());
        s.setActiveRooms(roomRepository.countByStatus(DataRoomStatus.ACTIVE));
        s.setDraftRooms(roomRepository.countByStatus(DataRoomStatus.DRAFT));
        s.setSuspendedRooms(roomRepository.countByStatus(DataRoomStatus.SUSPENDED));
        s.setClosedRooms(roomRepository.countByStatus(DataRoomStatus.CLOSED));
        s.setTotalDocuments(roomDocumentRepository.count());
        s.setTotalMembers(roomMemberRepository.count());
        s.setTotalEvents(roomEventRepository.count());
        s.setSuspiciousEventsCount(roomEventRepository.countBySuspiciousTrue());
        return s;
    }

    @Transactional(readOnly = true)
    public DataRoomResponse getRoomById(Long roomId, String currentUser, boolean isAdmin) {
        DataRoom r = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu ID: " + roomId));
        assertRoomAccess(r, currentUser, isAdmin);
        return mapToResponse(r, currentUser, isAdmin);
    }

    @Transactional
    public DataRoomResponse createRoom(DataRoomCreateRequest request, String currentUser) {
        DataRoom room = new DataRoom();
        room.setRoomCode(generateNextRoomCode());
        room.setName(request.getName());
        room.setPurpose(request.getPurpose());
        room.setDescription(request.getDescription());
        room.setOwnerUsername(currentUser);
        room.setStatus(DataRoomStatus.DRAFT);
        room.setWatermarkEnabled(request.isWatermarkEnabled());
        if (request.getWatermarkPattern() != null && !request.getWatermarkPattern().isBlank()) {
            room.setWatermarkPattern(request.getWatermarkPattern());
        }
        room.setAllowDownload(request.isAllowDownload());
        room.setExpiresAt(request.getExpiresAt());

        DataRoom saved = roomRepository.save(room);

        // Add creator as ROOM_OWNER
        DataRoomMember ownerMember = new DataRoomMember();
        ownerMember.setRoomId(saved.getId());
        ownerMember.setUsername(currentUser);
        userRepository.findByUsername(currentUser).ifPresent(u -> {
            ownerMember.setEmail(u.getEmail() != null ? u.getEmail() : (currentUser + "@edms.local"));
            ownerMember.setFullName(u.getFullName());
        });
        if (ownerMember.getEmail() == null) {
            ownerMember.setEmail(currentUser + "@edms.local");
        }
        ownerMember.setRole(DataRoomRole.ROOM_OWNER);
        ownerMember.setStatus(DataRoomMemberStatus.ACTIVE);
        ownerMember.setCanDownload(true);
        ownerMember.setCanViewMetadata(true);
        ownerMember.setJoinedAt(Instant.now());
        roomMemberRepository.save(ownerMember);

        // Log event
        logEvent(saved.getId(), null, currentUser, ownerMember.getEmail(), "ROOM_CREATED",
                "Khởi tạo phòng dữ liệu #" + saved.getRoomCode() + " ('" + saved.getName() + "')", null, false);

        return mapToResponse(saved, currentUser, true);
    }

    @Transactional
    public DataRoomResponse updateRoom(Long roomId, DataRoomUpdateRequest request, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        room.setName(request.getName());
        room.setPurpose(request.getPurpose());
        room.setDescription(request.getDescription());
        room.setWatermarkEnabled(request.isWatermarkEnabled());
        if (request.getWatermarkPattern() != null && !request.getWatermarkPattern().isBlank()) {
            room.setWatermarkPattern(request.getWatermarkPattern());
        }
        room.setAllowDownload(request.isAllowDownload());
        room.setExpiresAt(request.getExpiresAt());

        DataRoom updated = roomRepository.save(room);

        logEvent(updated.getId(), null, currentUser, null, "ROOM_UPDATED",
                "Cập nhật cấu hình phòng dữ liệu bởi " + currentUser, null, false);

        return mapToResponse(updated, currentUser, isAdmin);
    }

    @Transactional
    public DataRoomResponse updateStatus(Long roomId, DataRoomStatusUpdateRequest request, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        DataRoomStatus oldStatus = room.getStatus();
        DataRoomStatus newStatus = request.getStatus();

        if (oldStatus == newStatus) {
            return mapToResponse(room, currentUser, isAdmin);
        }

        room.setStatus(newStatus);
        DataRoom updated = roomRepository.save(room);

        String note = (request.getNote() != null && !request.getNote().isBlank()) ? (" - " + request.getNote()) : "";
        logEvent(updated.getId(), null, currentUser, null, "STATUS_CHANGED",
                "Chuyển trạng thái phòng từ " + oldStatus + " sang " + newStatus + note, null, false);

        return mapToResponse(updated, currentUser, isAdmin);
    }

    // --- Document Management ---

    @Transactional
    public DataRoomDocumentResponse addDocument(Long roomId, DataRoomDocumentAddRequest request, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        Document doc = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu ID: " + request.getDocumentId()));

        if (roomDocumentRepository.existsByRoomIdAndDocumentId(roomId, request.getDocumentId())) {
            throw new IllegalArgumentException("Tài liệu này đã tồn tại trong phòng dữ liệu");
        }

        Integer versionNum = request.getVersionNumber();
        if (versionNum == null) {
            List<DocumentVersion> versions = versionRepository.findByDocumentIdOrderByVersionNumberDesc(doc.getId());
            if (!versions.isEmpty()) {
                versionNum = versions.get(0).getVersionNumber();
            } else {
                versionNum = 1;
            }
        }

        DataRoomDocument rd = new DataRoomDocument();
        rd.setRoomId(room.getId());
        rd.setDocumentId(doc.getId());
        rd.setVersionNumber(versionNum);
        rd.setFolderPath(request.getFolderPath() != null && !request.getFolderPath().isBlank() ? request.getFolderPath() : "/");
        rd.setAddedBy(currentUser);
        rd.setAddedAt(Instant.now());

        DataRoomDocument saved = roomDocumentRepository.save(rd);

        logEvent(room.getId(), doc.getId(), currentUser, null, "DOCUMENT_ADDED",
                "Thêm tài liệu '" + doc.getTitle() + "' (v" + versionNum + ") vào thư mục " + rd.getFolderPath(), null, false);

        return mapToDocumentResponse(saved, doc);
    }

    @Transactional
    public void removeDocument(Long roomId, Long documentId, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        DataRoomDocument rd = roomDocumentRepository.findByRoomIdAndDocumentId(roomId, documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không có trong phòng dữ liệu"));

        roomDocumentRepository.delete(rd);

        String docTitle = documentRepository.findById(documentId).map(Document::getTitle).orElse("ID: " + documentId);
        logEvent(room.getId(), documentId, currentUser, null, "DOCUMENT_REMOVED",
                "Xóa tài liệu '" + docTitle + "' khỏi phòng dữ liệu", null, false);
    }

    @Transactional(readOnly = true)
    public List<DataRoomDocumentResponse> listDocuments(Long roomId, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomAccess(room, currentUser, isAdmin);

        List<DataRoomDocument> docs = roomDocumentRepository.findByRoomIdOrderByAddedAtDesc(roomId);
        List<DataRoomDocumentResponse> result = new ArrayList<>();

        for (DataRoomDocument rd : docs) {
            Document doc = documentRepository.findById(rd.getDocumentId()).orElse(null);
            if (doc != null) {
                result.add(mapToDocumentResponse(rd, doc));
            }
        }
        return result;
    }

    // --- Member & Invitation Management ---

    @Transactional
    public DataRoomMemberResponse addMember(Long roomId, DataRoomMemberAddRequest request, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        Optional<DataRoomMember> existing = roomMemberRepository.findByRoomIdAndEmail(roomId, request.getEmail());
        if (existing.isPresent() && existing.get().isActive()) {
            throw new IllegalArgumentException("Thành viên với email này đã tham gia phòng dữ liệu");
        }

        DataRoomMember member = existing.orElseGet(DataRoomMember::new);
        member.setRoomId(room.getId());
        member.setEmail(request.getEmail());
        member.setUsername(request.getUsername());
        member.setFullName(request.getFullName());
        member.setRole(request.getRole());
        member.setStatus(DataRoomMemberStatus.ACTIVE);
        member.setCanDownload(request.isCanDownload());
        member.setCanViewMetadata(request.isCanViewMetadata());
        member.setJoinedAt(Instant.now());

        if (request.getUsername() != null && (request.getFullName() == null || request.getFullName().isBlank())) {
            userRepository.findByUsername(request.getUsername()).ifPresent(u ->
                    member.setFullName(u.getFullName())
            );
        }

        DataRoomMember saved = roomMemberRepository.save(member);

        logEvent(room.getId(), null, currentUser, member.getEmail(), "MEMBER_ADDED",
                "Thêm thành viên " + member.getEmail() + " với vai trò " + member.getRole(), null, false);

        return mapToMemberResponse(saved);
    }

    @Transactional
    public DataRoomInvitationResponse inviteMember(Long roomId, DataRoomInviteRequest request, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        String token = UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plus(request.getExpiresInDays() > 0 ? request.getExpiresInDays() : 7, ChronoUnit.DAYS);

        DataRoomInvitation inv = new DataRoomInvitation();
        inv.setRoomId(room.getId());
        inv.setEmail(request.getEmail());
        inv.setToken(token);
        inv.setRole(request.getRole());
        inv.setStatus(DataRoomInvitationStatus.PENDING);
        inv.setExpiresAt(expiresAt);
        inv.setCreatedBy(currentUser);

        DataRoomInvitation saved = roomInvitationRepository.save(inv);

        logEvent(room.getId(), null, currentUser, inv.getEmail(), "INVITATION_SENT",
                "Gửi lời mời tham gia VDR tới " + inv.getEmail() + " (vai trò: " + inv.getRole() + ")", null, false);

        return mapToInvitationResponse(saved, room.getName());
    }

    @Transactional
    public DataRoomMemberResponse acceptInvitation(String token, String currentUser) {
        DataRoomInvitation inv = roomInvitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Mã mời không tồn tại hoặc đã hết hạn"));

        if (!inv.isValid()) {
            throw new IllegalStateException("Lời mời không còn hiệu lực hoặc đã được sử dụng");
        }

        DataRoom room = roomRepository.findById(inv.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Phòng dữ liệu không còn tồn tại"));

        DataRoomMember member = roomMemberRepository.findByRoomIdAndEmail(room.getId(), inv.getEmail())
                .orElseGet(() -> {
                    DataRoomMember m = new DataRoomMember();
                    m.setRoomId(room.getId());
                    m.setEmail(inv.getEmail());
                    return m;
                });

        member.setUsername(currentUser);
        userRepository.findByUsername(currentUser).ifPresent(u ->
                member.setFullName(u.getFullName())
        );
        member.setRole(inv.getRole());
        member.setStatus(DataRoomMemberStatus.ACTIVE);
        member.setCanDownload(room.isAllowDownload());
        member.setCanViewMetadata(true);
        member.setJoinedAt(Instant.now());

        DataRoomMember savedMember = roomMemberRepository.save(member);

        inv.setStatus(DataRoomInvitationStatus.ACCEPTED);
        inv.setAcceptedAt(Instant.now());
        roomInvitationRepository.save(inv);

        logEvent(room.getId(), null, currentUser, inv.getEmail(), "INVITATION_ACCEPTED",
                "Chấp nhận lời mời tham gia VDR bởi " + currentUser, null, false);

        return mapToMemberResponse(savedMember);
    }

    @Transactional
    public DataRoomMemberResponse revokeMember(Long roomId, Long memberId, String reason, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        DataRoomMember member = roomMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên"));

        if (!member.getRoomId().equals(room.getId())) {
            throw new IllegalArgumentException("Thành viên không thuộc phòng dữ liệu này");
        }

        if (member.getRole() == DataRoomRole.ROOM_OWNER && !isAdmin) {
            throw new AccessDeniedException("Không thể thu hồi quyền của chủ phòng (Room Owner)");
        }

        member.setStatus(DataRoomMemberStatus.REVOKED);
        member.setRevokedAt(Instant.now());
        member.setRevokedBy(currentUser);
        member.setRevokeReason(reason);

        DataRoomMember saved = roomMemberRepository.save(member);

        logEvent(room.getId(), null, currentUser, member.getEmail(), "MEMBER_REVOKED",
                "Thu hồi quyền truy cập của " + member.getEmail() + " - Lý do: " + (reason != null ? reason : "Không nêu rõ"),
                null, true);

        return mapToMemberResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DataRoomMemberResponse> listMembers(Long roomId, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomAccess(room, currentUser, isAdmin);

        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DataRoomInvitationResponse> listInvitations(Long roomId, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomManagePermission(room, currentUser, isAdmin);

        return roomInvitationRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(inv -> mapToInvitationResponse(inv, room.getName()))
                .collect(Collectors.toList());
    }

    // --- Secure Viewing & Download Enforcement ---

    public static class SecureFilePayload {
        private final byte[] bytes;
        private final String contentType;
        private final String fileName;

        public SecureFilePayload(byte[] bytes, String contentType, String fileName) {
            this.bytes = bytes;
            this.contentType = contentType;
            this.fileName = fileName;
        }

        public byte[] getBytes() {
            return bytes;
        }

        public String getContentType() {
            return contentType;
        }

        public String getFileName() {
            return fileName;
        }
    }

    @Transactional
    public SecureFilePayload viewDocument(Long roomId, Long documentId, String currentUser, String ipAddress, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));

        assertRoomActiveAndAccessible(room);
        assertRoomAccess(room, currentUser, isAdmin);

        DataRoomDocument rd = roomDocumentRepository.findByRoomIdAndDocumentId(roomId, documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không thuộc phòng dữ liệu này"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        DocumentVersion version = resolveDocumentVersion(doc, rd.getVersionNumber());

        try {
            Resource fileRes = fileStorageService.loadFileAsResource(version.getStoredFileName());
            byte[] rawBytes = fileRes.getInputStream().readAllBytes();

            // Log successful viewing
            logEvent(room.getId(), doc.getId(), currentUser, null, "VDR_DOCUMENT_VIEWED",
                    "Xem tài liệu an toàn: '" + doc.getTitle() + "' (v" + version.getVersionNumber() + ")", ipAddress, false);

            if (room.isWatermarkEnabled()) {
                String watermarkText = resolveWatermarkText(room.getWatermarkPattern(), currentUser, ipAddress);

                if (watermarkService.isPdf(version.getContentType(), version.getOriginalFileName())) {
                    byte[] watermarkedPdf = watermarkService.applyWatermarkAndQrToPdf(
                            rawBytes, doc, version, currentUser, watermarkText, true, null
                    );
                    return new SecureFilePayload(watermarkedPdf, "application/pdf", version.getOriginalFileName());
                } else if (watermarkService.isImage(version.getContentType(), version.getOriginalFileName())) {
                    byte[] watermarkedImg = watermarkService.applyWatermarkAndQrToImage(
                            rawBytes, doc, version, currentUser, watermarkText, true, null
                    );
                    return new SecureFilePayload(watermarkedImg, version.getContentType(), version.getOriginalFileName());
                }
            }

            return new SecureFilePayload(rawBytes, version.getContentType(), version.getOriginalFileName());

        } catch (Exception ex) {
            log.error("Error streaming document in VDR: {}", ex.getMessage(), ex);
            throw new RuntimeException("Không thể hiển thị tài liệu an toàn: " + ex.getMessage());
        }
    }

    @Transactional
    public SecureFilePayload downloadDocument(Long roomId, Long documentId, String currentUser, String ipAddress, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));

        assertRoomActiveAndAccessible(room);
        assertRoomAccess(room, currentUser, isAdmin);

        DataRoomDocument rd = roomDocumentRepository.findByRoomIdAndDocumentId(roomId, documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không thuộc phòng dữ liệu này"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        boolean isOwner = room.getOwnerUsername().equalsIgnoreCase(currentUser);
        boolean allowed = isAdmin || isOwner;

        if (!allowed) {
            Optional<DataRoomMember> memberOpt = roomMemberRepository.findByRoomIdAndUsername(room.getId(), currentUser);
            if (memberOpt.isPresent() && memberOpt.get().isActive()) {
                allowed = room.isAllowDownload() && memberOpt.get().isCanDownload();
            }
        }

        if (!allowed) {
            // Anti-leak enforcement: Log SUSPICIOUS denial event
            logEvent(room.getId(), doc.getId(), currentUser, null, "VDR_DOWNLOAD_DENIED",
                    "Cố gắng tải tài liệu bất chấp chính sách cấm tải (Anti-leak violation) - Tài liệu: '" + doc.getTitle() + "'",
                    ipAddress, true);

            throw new AccessDeniedException("Phòng dữ liệu bảo mật không cho phép tải tài liệu về máy cá nhân (Chính sách Anti-leak đang được thực thi). Hành vi này đã được ghi vào nhật ký an ninh.");
        }

        DocumentVersion version = resolveDocumentVersion(doc, rd.getVersionNumber());
        try {
            Resource fileRes = fileStorageService.loadFileAsResource(version.getStoredFileName());
            byte[] bytes = fileRes.getInputStream().readAllBytes();

            logEvent(room.getId(), doc.getId(), currentUser, null, "VDR_DOCUMENT_DOWNLOADED",
                    "Tải tệp tài liệu được phép: '" + doc.getTitle() + "'", ipAddress, false);

            return new SecureFilePayload(bytes, version.getContentType(), version.getOriginalFileName());
        } catch (Exception ex) {
            throw new RuntimeException("Lỗi khi tải tệp: " + ex.getMessage());
        }
    }

    // --- Audit & Activity Tracking ---

    @Transactional(readOnly = true)
    public List<DataRoomEventResponse> listEvents(Long roomId, Boolean suspiciousOnly, String currentUser, boolean isAdmin) {
        DataRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng dữ liệu"));
        assertRoomAccess(room, currentUser, isAdmin);

        List<DataRoomEvent> events;
        if (Boolean.TRUE.equals(suspiciousOnly)) {
            events = roomEventRepository.findByRoomIdAndSuspiciousTrueOrderByTimestampDesc(roomId);
        } else {
            events = roomEventRepository.findByRoomIdOrderByTimestampDesc(roomId);
        }

        return events.stream().map(this::mapToEventResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DataRoomEventResponse> listAllSuspiciousEvents(String currentUser, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Chỉ quản trị viên mới có quyền xem toàn bộ sự cố bảo mật");
        }
        return roomEventRepository.findBySuspiciousTrueOrderByTimestampDesc().stream()
                .map(this::mapToEventResponse)
                .collect(Collectors.toList());
    }

    // --- Helpers & Mappers ---

    @Transactional
    public void recordSuspiciousEvent(Long roomId, Long documentId, String username, String eventType, String description, String ipAddress) {
        logEvent(roomId, documentId, username, null, eventType, description, ipAddress, true);
    }

    private void logEvent(Long roomId, Long documentId, String username, String email, String eventType, String description, String ipAddress, boolean suspicious) {
        DataRoomEvent event = new DataRoomEvent(roomId, documentId, username, email, eventType, description, ipAddress, suspicious);
        roomEventRepository.save(event);
    }

    private DocumentVersion resolveDocumentVersion(Document doc, Integer versionNumber) {
        if (versionNumber != null) {
            return versionRepository.findByDocumentIdAndVersionNumber(doc.getId(), versionNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản v" + versionNumber));
        }
        List<DocumentVersion> versions = versionRepository.findByDocumentIdOrderByVersionNumberDesc(doc.getId());
        if (versions.isEmpty()) {
            throw new ResourceNotFoundException("Tài liệu không có phiên bản nào");
        }
        return versions.get(0);
    }

    private String resolveWatermarkText(String pattern, String user, String ip) {
        String base = (pattern != null && !pattern.isBlank()) ? pattern : "VDR CONFIDENTIAL - {user} - {date}";
        String nowStr = Instant.now().toString().substring(0, 19).replace("T", " ");
        return base.replace("{user}", user != null ? user : "ANON")
                .replace("{ip}", ip != null ? ip : "127.0.0.1")
                .replace("{date}", nowStr);
    }

    private void assertRoomAccess(DataRoom room, String currentUser, boolean isAdmin) {
        if (isAdmin || room.getOwnerUsername().equalsIgnoreCase(currentUser)) {
            return;
        }
        Optional<DataRoomMember> member = roomMemberRepository.findByRoomIdAndUsername(room.getId(), currentUser);
        if (member.isEmpty() || !member.get().isActive()) {
            throw new AccessDeniedException("Bạn không có quyền truy cập phòng dữ liệu này");
        }
    }

    private void assertRoomManagePermission(DataRoom room, String currentUser, boolean isAdmin) {
        if (isAdmin || room.getOwnerUsername().equalsIgnoreCase(currentUser)) {
            return;
        }
        Optional<DataRoomMember> member = roomMemberRepository.findByRoomIdAndUsername(room.getId(), currentUser);
        if (member.isEmpty() || !member.get().isActive()) {
            throw new AccessDeniedException("Bạn không có quyền quản lý phòng dữ liệu này");
        }
        if (member.get().getRole() != DataRoomRole.ROOM_OWNER && member.get().getRole() != DataRoomRole.ROOM_MANAGER) {
            throw new AccessDeniedException("Chỉ chủ phòng hoặc người điều phối (Manager) mới có quyền quản lý");
        }
    }

    private void assertRoomActiveAndAccessible(DataRoom room) {
        if (room.getStatus() != DataRoomStatus.ACTIVE) {
            throw new IllegalStateException("Phòng dữ liệu hiện không ở trạng thái ACTIVE (Trạng thái: " + room.getStatus() + ")");
        }
        if (room.isExpired()) {
            throw new IllegalStateException("Phòng dữ liệu đã hết hạn truy cập vào ngày: " + room.getExpiresAt());
        }
    }

    private DataRoomResponse mapToResponse(DataRoom r, String currentUser, boolean isAdmin) {
        DataRoomResponse res = new DataRoomResponse();
        res.setId(r.getId());
        res.setRoomCode(r.getRoomCode());
        res.setName(r.getName());
        res.setPurpose(r.getPurpose());
        res.setDescription(r.getDescription());
        res.setOwnerUsername(r.getOwnerUsername());
        res.setStatus(r.getStatus());
        res.setWatermarkEnabled(r.isWatermarkEnabled());
        res.setWatermarkPattern(r.getWatermarkPattern());
        res.setAllowDownload(r.isAllowDownload());
        res.setStartDate(r.getStartDate());
        res.setExpiresAt(r.getExpiresAt());
        res.setCreatedAt(r.getCreatedAt());
        res.setUpdatedAt(r.getUpdatedAt());
        res.setExpired(r.isExpired());
        res.setAccessible(r.isAccessible());

        res.setDocumentCount((int) roomDocumentRepository.countByRoomId(r.getId()));
        res.setMemberCount((int) roomMemberRepository.countByRoomId(r.getId()));

        if (isAdmin || r.getOwnerUsername().equalsIgnoreCase(currentUser)) {
            res.setCurrentUserRole(DataRoomRole.ROOM_OWNER);
            res.setCurrentUserCanDownload(true);
        } else {
            roomMemberRepository.findByRoomIdAndUsername(r.getId(), currentUser).ifPresent(m -> {
                res.setCurrentUserRole(m.getRole());
                res.setCurrentUserCanDownload(r.isAllowDownload() && m.isCanDownload());
            });
        }

        return res;
    }

    private DataRoomDocumentResponse mapToDocumentResponse(DataRoomDocument rd, Document doc) {
        DataRoomDocumentResponse res = new DataRoomDocumentResponse();
        res.setId(rd.getId());
        res.setRoomId(rd.getRoomId());
        res.setDocumentId(rd.getDocumentId());
        res.setVersionNumber(rd.getVersionNumber());
        res.setTitle(doc.getTitle());
        res.setDescription(doc.getDescription());
        res.setDocumentType(doc.getDocumentType());
        res.setFolderPath(rd.getFolderPath());
        res.setAddedBy(rd.getAddedBy());
        res.setAddedAt(rd.getAddedAt());

        // Fill file metadata from version
        versionRepository.findByDocumentIdAndVersionNumber(doc.getId(), rd.getVersionNumber()).ifPresent(v -> {
            res.setOriginalFileName(v.getOriginalFileName());
            res.setContentType(v.getContentType());
            res.setFileSize(v.getFileSize());
            res.setFileHash(v.getFileHash());
        });

        return res;
    }

    private DataRoomMemberResponse mapToMemberResponse(DataRoomMember m) {
        DataRoomMemberResponse res = new DataRoomMemberResponse();
        res.setId(m.getId());
        res.setRoomId(m.getRoomId());
        res.setUsername(m.getUsername());
        res.setEmail(m.getEmail());
        res.setFullName(m.getFullName());
        res.setRole(m.getRole());
        res.setStatus(m.getStatus());
        res.setCanDownload(m.isCanDownload());
        res.setCanViewMetadata(m.isCanViewMetadata());
        res.setInvitedAt(m.getInvitedAt());
        res.setJoinedAt(m.getJoinedAt());
        res.setRevokedAt(m.getRevokedAt());
        res.setRevokedBy(m.getRevokedBy());
        res.setRevokeReason(m.getRevokeReason());
        return res;
    }

    private DataRoomInvitationResponse mapToInvitationResponse(DataRoomInvitation inv, String roomName) {
        DataRoomInvitationResponse res = new DataRoomInvitationResponse();
        res.setId(inv.getId());
        res.setRoomId(inv.getRoomId());
        res.setRoomName(roomName);
        res.setEmail(inv.getEmail());
        res.setToken(inv.getToken());
        res.setRole(inv.getRole());
        res.setStatus(inv.getStatus());
        res.setExpiresAt(inv.getExpiresAt());
        res.setCreatedBy(inv.getCreatedBy());
        res.setCreatedAt(inv.getCreatedAt());
        res.setAcceptedAt(inv.getAcceptedAt());
        res.setExpired(inv.isExpired());
        res.setValid(inv.isValid());
        return res;
    }

    private DataRoomEventResponse mapToEventResponse(DataRoomEvent e) {
        DataRoomEventResponse res = new DataRoomEventResponse();
        res.setId(e.getId());
        res.setRoomId(e.getRoomId());
        res.setDocumentId(e.getDocumentId());
        res.setUsername(e.getUsername());
        res.setEmail(e.getEmail());
        res.setEventType(e.getEventType());
        res.setDescription(e.getDescription());
        res.setIpAddress(e.getIpAddress());
        res.setSuspicious(e.isSuspicious());
        res.setInvestigationCaseId(e.getInvestigationCaseId());
        res.setTimestamp(e.getTimestamp());

        if (e.getDocumentId() != null) {
            documentRepository.findById(e.getDocumentId()).ifPresent(d -> res.setDocumentTitle(d.getTitle()));
        }

        return res;
    }
}
