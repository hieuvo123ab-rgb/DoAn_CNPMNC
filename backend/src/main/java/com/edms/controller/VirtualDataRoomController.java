package com.edms.controller;

import com.edms.dto.*;
import com.edms.service.VirtualDataRoomService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/vdr")
public class VirtualDataRoomController {

    private final VirtualDataRoomService vdrService;

    public VirtualDataRoomController(VirtualDataRoomService vdrService) {
        this.vdrService = vdrService;
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<DataRoomResponse>> listRooms(Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listRooms(authentication.getName(), isAdmin));
    }

    @GetMapping("/rooms/summary")
    public ResponseEntity<DataRoomSummaryDto> getSummary(Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.getSummary(authentication.getName(), isAdmin));
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<DataRoomResponse> getRoomById(
            @PathVariable("id") Long id,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.getRoomById(id, authentication.getName(), isAdmin));
    }

    @PostMapping("/rooms")
    public ResponseEntity<DataRoomResponse> createRoom(
            @Valid @RequestBody DataRoomCreateRequest request,
            Authentication authentication) {
        DataRoomResponse res = vdrService.createRoom(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<DataRoomResponse> updateRoom(
            @PathVariable("id") Long id,
            @Valid @RequestBody DataRoomUpdateRequest request,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.updateRoom(id, request, authentication.getName(), isAdmin));
    }

    @PutMapping("/rooms/{id}/status")
    public ResponseEntity<DataRoomResponse> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody DataRoomStatusUpdateRequest request,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.updateStatus(id, request, authentication.getName(), isAdmin));
    }

    // --- Document Endpoints ---

    @GetMapping("/rooms/{id}/documents")
    public ResponseEntity<List<DataRoomDocumentResponse>> listDocuments(
            @PathVariable("id") Long id,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listDocuments(id, authentication.getName(), isAdmin));
    }

    @PostMapping("/rooms/{id}/documents")
    public ResponseEntity<DataRoomDocumentResponse> addDocument(
            @PathVariable("id") Long id,
            @Valid @RequestBody DataRoomDocumentAddRequest request,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        DataRoomDocumentResponse res = vdrService.addDocument(id, request, authentication.getName(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @DeleteMapping("/rooms/{id}/documents/{documentId}")
    public ResponseEntity<Void> removeDocument(
            @PathVariable("id") Long id,
            @PathVariable("documentId") Long documentId,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        vdrService.removeDocument(id, documentId, authentication.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    // --- Member & Invitation Endpoints ---

    @GetMapping("/rooms/{id}/members")
    public ResponseEntity<List<DataRoomMemberResponse>> listMembers(
            @PathVariable("id") Long id,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listMembers(id, authentication.getName(), isAdmin));
    }

    @PostMapping("/rooms/{id}/members")
    public ResponseEntity<DataRoomMemberResponse> addMember(
            @PathVariable("id") Long id,
            @Valid @RequestBody DataRoomMemberAddRequest request,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        DataRoomMemberResponse res = vdrService.addMember(id, request, authentication.getName(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/rooms/{id}/invitations")
    public ResponseEntity<List<DataRoomInvitationResponse>> listInvitations(
            @PathVariable("id") Long id,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listInvitations(id, authentication.getName(), isAdmin));
    }

    @PostMapping("/rooms/{id}/invitations")
    public ResponseEntity<DataRoomInvitationResponse> inviteMember(
            @PathVariable("id") Long id,
            @Valid @RequestBody DataRoomInviteRequest request,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        DataRoomInvitationResponse res = vdrService.inviteMember(id, request, authentication.getName(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/invitations/accept")
    public ResponseEntity<DataRoomMemberResponse> acceptInvitation(
            @RequestParam("token") String token,
            Authentication authentication) {
        DataRoomMemberResponse res = vdrService.acceptInvitation(token, authentication.getName());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/rooms/{id}/members/{memberId}")
    public ResponseEntity<DataRoomMemberResponse> revokeMember(
            @PathVariable("id") Long id,
            @PathVariable("memberId") Long memberId,
            @RequestParam(value = "reason", required = false) String reason,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        DataRoomMemberResponse res = vdrService.revokeMember(id, memberId, reason, authentication.getName(), isAdmin);
        return ResponseEntity.ok(res);
    }

    // --- Secure Viewing & Download Enforcement ---

    @GetMapping("/rooms/{id}/documents/{documentId}/view")
    public ResponseEntity<ByteArrayResource> viewDocument(
            @PathVariable("id") Long id,
            @PathVariable("documentId") Long documentId,
            HttpServletRequest servletRequest,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();

        VirtualDataRoomService.SecureFilePayload payload = vdrService.viewDocument(
                id, documentId, authentication.getName(), ipAddress, isAdmin
        );

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (payload.getContentType() != null) {
            try {
                mediaType = MediaType.parseMediaType(payload.getContentType());
            } catch (Exception ignored) {
            }
        }

        String encodedName = URLEncoder.encode(payload.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedName + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(new ByteArrayResource(payload.getBytes()));
    }

    @GetMapping("/rooms/{id}/documents/{documentId}/download")
    public ResponseEntity<ByteArrayResource> downloadDocument(
            @PathVariable("id") Long id,
            @PathVariable("documentId") Long documentId,
            HttpServletRequest servletRequest,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();

        try {
            VirtualDataRoomService.SecureFilePayload payload = vdrService.downloadDocument(
                    id, documentId, authentication.getName(), ipAddress, isAdmin
            );

            String encodedName = URLEncoder.encode(payload.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedName + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .body(new ByteArrayResource(payload.getBytes()));
        } catch (org.springframework.security.access.AccessDeniedException ade) {
            vdrService.recordSuspiciousEvent(id, documentId, authentication.getName(), "VDR_DOWNLOAD_DENIED",
                    "Cố gắng tải tài liệu bất chấp chính sách cấm tải (Anti-leak violation)", ipAddress);
            throw ade;
        }
    }

    // --- Audit & Activity Endpoints ---

    @GetMapping("/rooms/{id}/events")
    public ResponseEntity<List<DataRoomEventResponse>> listEvents(
            @PathVariable("id") Long id,
            @RequestParam(value = "suspiciousOnly", required = false) Boolean suspiciousOnly,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listEvents(id, suspiciousOnly, authentication.getName(), isAdmin));
    }

    @GetMapping("/suspicious-events")
    public ResponseEntity<List<DataRoomEventResponse>> listAllSuspiciousEvents(Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        return ResponseEntity.ok(vdrService.listAllSuspiciousEvents(authentication.getName(), isAdmin));
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
