package com.edms.service;

import com.edms.dto.DocumentMetadataRequest;
import com.edms.entity.AccessMode;
import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.entity.LifecycleStatus;
import com.edms.exception.ResourceNotFoundException;
import com.edms.exception.WorkflowConflictException;
import com.edms.model.ExtractionStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

@Service
public class DocumentCoreService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final FileStorageService fileStorageService;
    private final DocumentAccessService documentAccessService;
    private final DocumentReviewService documentReviewService;
    private final AuditService auditService;
    // Phase 13: @Lazy to break potential circular dependency chain
    private final IntegrityService integrityService;

    @Autowired
    public DocumentCoreService(DocumentRepository documentRepository,
                               DocumentVersionRepository documentVersionRepository,
                               FileStorageService fileStorageService,
                               DocumentAccessService documentAccessService,
                               DocumentReviewService documentReviewService,
                               AuditService auditService,
                               @Lazy IntegrityService integrityService) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.fileStorageService = fileStorageService;
        this.documentAccessService = documentAccessService;
        this.documentReviewService = documentReviewService;
        this.auditService = auditService;
        this.integrityService = integrityService;
    }

    /** Phase 13: Read file bytes for hashing. Returns empty array on failure (best-effort). */
    private byte[] readFileBytesQuietly(String storedFileName) {
        try {
            Path path = fileStorageService.getFilePath(storedFileName);
            return Files.readAllBytes(path);
        } catch (IOException e) {
            return new byte[0];
        }
    }

    @Transactional
    public Document createDocumentAndVersion1(MultipartFile file, DocumentMetadataRequest metadata, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            originalFileName = "unnamed_file";
        }

        AccessMode accessMode = AccessMode.INTERNAL;
        if (metadata.getAccessMode() != null && "PRIVATE".equalsIgnoreCase(metadata.getAccessMode().trim())) {
            accessMode = AccessMode.PRIVATE;
        }

        String storedFileName = fileStorageService.storeFile(file);

        Document document = new Document(
                metadata.getTitle(),
                metadata.getDescription(),
                metadata.getDocumentType(),
                originalFileName,
                storedFileName,
                file.getContentType(),
                file.getSize(),
                username,
                accessMode
        );
        document.setCurrentVersionNumber(1);

        Document savedDoc = documentRepository.save(document);

        DocumentVersion version1 = new DocumentVersion(
                savedDoc,
                1,
                originalFileName,
                storedFileName,
                file.getContentType(),
                file.getSize(),
                username,
                "Phiên bản ban đầu"
        );
        version1.setExtractionStatus(ExtractionStatus.PENDING);
        // Phase 13: Stamp SHA-256 hash of the file bytes before persisting
        try {
            byte[] fileBytes = file.getBytes();
            integrityService.stampHash(version1, fileBytes);
        } catch (Exception e) {
            // Best-effort hash: core upload is never blocked by hash failure
        }
        documentVersionRepository.save(version1);

        auditService.log(username, "DOCUMENT_UPLOAD", "DOCUMENT", savedDoc.getId().toString(),
                "Tải lên tài liệu: " + savedDoc.getTitle() + " (" + savedDoc.getOriginalFileName() + ") [" + accessMode.name() + "]", null);

        return savedDoc;
    }

    @Transactional
    public DocumentVersion uploadNewVersionCore(Long documentId, MultipartFile file, String changeNote, String username, boolean isAdmin) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được để trống");
        }

        Document doc = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        if (doc.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể tải lên phiên bản mới");
        }
        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể tải lên phiên bản mới");
        }

        documentAccessService.requireEdit(doc, username, isAdmin);

        Integer maxVersion = documentVersionRepository.findMaxVersionNumberByDocumentId(documentId);
        int nextVersion = (maxVersion != null ? maxVersion : 0) + 1;

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            originalFileName = "unnamed_file";
        }

        String storedFileName = fileStorageService.storeFile(file);
        try {
            DocumentVersion newVersion = new DocumentVersion(
                    doc,
                    nextVersion,
                    originalFileName,
                    storedFileName,
                    file.getContentType(),
                    file.getSize(),
                    username,
                    changeNote != null && !changeNote.isBlank() ? changeNote.trim() : ("Cập nhật phiên bản " + nextVersion)
            );
            newVersion.setExtractionStatus(ExtractionStatus.PENDING);
            // Phase 13: Stamp SHA-256 hash before persisting new version
            try {
                byte[] fileBytes = file.getBytes();
                integrityService.stampHash(newVersion, fileBytes);
            } catch (Exception e) {
                // Best-effort hash: core version upload is never blocked by hash failure
            }
            newVersion = documentVersionRepository.save(newVersion);

            doc.setCurrentVersionNumber(nextVersion);
            doc.setOriginalFileName(originalFileName);
            doc.setStoredFileName(storedFileName);
            doc.setContentType(file.getContentType());
            doc.setFileSize(file.getSize());
            doc.setUpdatedAt(Instant.now());
            documentRepository.save(doc);

            // Supersede any active pending reviews for this document
            documentReviewService.supersedePendingReviews(doc, nextVersion, username);

            auditService.log(username, "DOCUMENT_VERSION_UPLOAD", "DOCUMENT", doc.getId().toString(),
                    username + " tải lên phiên bản " + nextVersion + " cho tài liệu #" + doc.getId() + " (" + originalFileName + ")", null);

            return newVersion;
        } catch (Exception ex) {
            fileStorageService.deleteStoredFile(storedFileName);
            throw ex;
        }
    }

    @Transactional
    public DocumentVersion restoreVersionCore(Long documentId, Integer versionNumber, String username, boolean isAdmin) {
        Document doc = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu với ID: " + documentId));

        if (doc.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
            throw new WorkflowConflictException("Tài liệu đã được lưu trữ (ARCHIVED), không thể khôi phục phiên bản");
        }
        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            throw new WorkflowConflictException("Tài liệu đã bị tiêu hủy (DISPOSED), không thể khôi phục phiên bản");
        }

        documentAccessService.requireEdit(doc, username, isAdmin);

        DocumentVersion oldVersion = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản " + versionNumber + " để khôi phục"));

        Integer maxVersion = documentVersionRepository.findMaxVersionNumberByDocumentId(documentId);
        int nextVersion = (maxVersion != null ? maxVersion : 0) + 1;

        String newStoredFileName = fileStorageService.copyStoredFile(oldVersion.getStoredFileName(), oldVersion.getOriginalFileName());
        try {
            DocumentVersion restoredVersion = new DocumentVersion(
                    doc,
                    nextVersion,
                    oldVersion.getOriginalFileName(),
                    newStoredFileName,
                    oldVersion.getContentType(),
                    oldVersion.getFileSize(),
                    username,
                    "Khôi phục từ phiên bản " + versionNumber
            );
            restoredVersion.setExtractionStatus(ExtractionStatus.PENDING);
            // Phase 13: Stamp SHA-256 hash of the newly copied file
            try {
                byte[] fileBytes = readFileBytesQuietly(newStoredFileName);
                if (fileBytes.length > 0) {
                    integrityService.stampHash(restoredVersion, fileBytes);
                }
            } catch (Exception e) {
                // Best-effort hash: core restore is never blocked by hash failure
            }
            restoredVersion = documentVersionRepository.save(restoredVersion);

            doc.setCurrentVersionNumber(nextVersion);
            doc.setOriginalFileName(oldVersion.getOriginalFileName());
            doc.setStoredFileName(newStoredFileName);
            doc.setContentType(oldVersion.getContentType());
            doc.setFileSize(oldVersion.getFileSize());
            doc.setUpdatedAt(Instant.now());
            documentRepository.save(doc);

            // Supersede any active pending reviews for this document
            documentReviewService.supersedePendingReviews(doc, nextVersion, username);

            auditService.log(username, "DOCUMENT_VERSION_RESTORE", "DOCUMENT", doc.getId().toString(),
                    username + " khôi phục phiên bản " + versionNumber + " thành phiên bản mới " + nextVersion + " cho tài liệu #" + doc.getId(), null);

            return restoredVersion;
        } catch (Exception ex) {
            fileStorageService.deleteStoredFile(newStoredFileName);
            throw ex;
        }
    }
}
