package com.edms.controller;

import com.edms.dto.PublicVerificationResponse;
import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.model.IntegrityStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import com.edms.service.IntegrityService;
import com.edms.service.IntegrityService.IntegrityVerificationResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

/**
 * Phase 14: Public Verification Controller for QR code lookups and file dropzone verification.
 * Permits anonymous access via SecurityConfig.
 */
@RestController
@RequestMapping("/api/public")
public class PublicVerificationController {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final IntegrityService integrityService;

    public PublicVerificationController(DocumentRepository documentRepository,
                                        DocumentVersionRepository documentVersionRepository,
                                        IntegrityService integrityService) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.integrityService = integrityService;
    }

    @GetMapping("/verify")
    public ResponseEntity<PublicVerificationResponse> verifyPublic(
            @RequestParam(required = false) Long docId,
            @RequestParam(required = false) Integer version,
            @RequestParam(required = false) String hash) {

        if ((hash == null || hash.isBlank()) && (docId == null || version == null)) {
            return ResponseEntity.badRequest().body(
                    PublicVerificationResponse.notFound("Vui lòng cung cấp mã băm (hash) hoặc cặp (docId, version) để tra cứu."));
        }

        Optional<DocumentVersion> versionOpt = Optional.empty();

        if (hash != null && !hash.isBlank()) {
            versionOpt = documentVersionRepository.findFirstByFileHash(hash.trim());
        }

        if (versionOpt.isEmpty() && docId != null && version != null) {
            versionOpt = documentVersionRepository.findByDocumentIdAndVersionNumber(docId, version);
        }

        if (versionOpt.isEmpty()) {
            return ResponseEntity.ok(PublicVerificationResponse.notFound(
                    "Không tìm thấy bản ghi tài liệu hoặc phiên bản tương ứng trong hệ thống EDMS."));
        }

        DocumentVersion docVersion = versionOpt.get();
        Document doc = docVersion.getDocument();

        IntegrityVerificationResult result = integrityService.verifyIntegrityDirect(doc, docVersion);

        PublicVerificationResponse resp = new PublicVerificationResponse();
        resp.setFound(true);
        resp.setDocumentId(doc.getId());
        resp.setTitle(doc.getTitle());
        resp.setVersionNumber(docVersion.getVersionNumber());
        resp.setDocumentType(doc.getDocumentType());
        resp.setFileHash(result.fileHash());
        resp.setHashAlgorithm(result.hashAlgorithm());
        resp.setIntegrityStatus(result.integrityStatus());
        resp.setSignatureStatus(result.signatureStatus());
        resp.setSignerUsername(result.signerUsername());
        resp.setSignedAt(result.signedAt());
        resp.setCertSerialNumber(result.certSerialNumber());
        resp.setCertSubject(result.certSubject());
        resp.setCertValidFrom(result.certValidFrom());
        resp.setCertValidUntil(result.certValidUntil());
        resp.setVerifiedAt(Instant.now());

        boolean isTampered = (result.integrityStatus() == IntegrityStatus.TAMPERED);
        resp.setTampered(isTampered);
        resp.setMessage(isTampered
                ? "CẢNH BÁO: Tệp tin lưu trữ thực tế không khớp với mã băm đăng ký ban đầu (có dấu hiệu bị can thiệp trái phép)!"
                : "XÁC THỰC THÀNH CÔNG: Tài liệu chính hãng và bảo toàn tính toàn vẹn 100%.");

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-file")
    public ResponseEntity<PublicVerificationResponse> verifyUploadedFile(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    PublicVerificationResponse.notFound("Vui lòng tải lên tệp tin cần đối soát."));
        }

        byte[] bytes = file.getBytes();
        String computedHash = integrityService.computeSha256(bytes);

        Optional<DocumentVersion> versionOpt = documentVersionRepository.findFirstByFileHash(computedHash);

        if (versionOpt.isEmpty()) {
            PublicVerificationResponse resp = PublicVerificationResponse.notFound(
                    "Mã băm SHA-256 của tệp (" + computedHash + ") không khớp với bất kỳ tài liệu hợp lệ nào trong hệ thống.");
            resp.setFileHash(computedHash);
            resp.setHashAlgorithm("SHA-256");
            return ResponseEntity.ok(resp);
        }

        DocumentVersion docVersion = versionOpt.get();
        Document doc = docVersion.getDocument();

        IntegrityVerificationResult result = integrityService.verifyIntegrityDirect(doc, docVersion);

        PublicVerificationResponse resp = new PublicVerificationResponse();
        resp.setFound(true);
        resp.setDocumentId(doc.getId());
        resp.setTitle(doc.getTitle());
        resp.setVersionNumber(docVersion.getVersionNumber());
        resp.setDocumentType(doc.getDocumentType());
        resp.setFileHash(computedHash);
        resp.setHashAlgorithm("SHA-256");
        resp.setIntegrityStatus(result.integrityStatus());
        resp.setSignatureStatus(result.signatureStatus());
        resp.setSignerUsername(result.signerUsername());
        resp.setSignedAt(result.signedAt());
        resp.setCertSerialNumber(result.certSerialNumber());
        resp.setCertSubject(result.certSubject());
        resp.setCertValidFrom(result.certValidFrom());
        resp.setCertValidUntil(result.certValidUntil());
        resp.setVerifiedAt(Instant.now());
        resp.setTampered(result.integrityStatus() == IntegrityStatus.TAMPERED);
        resp.setMessage("TỆP TIN KHỚP CHÍNH XÁC: Đã đối soát thành công với tài liệu #" + doc.getId() + " (v" + docVersion.getVersionNumber() + ")!");

        return ResponseEntity.ok(resp);
    }
}
