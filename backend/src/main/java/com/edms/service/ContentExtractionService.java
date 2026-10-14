package com.edms.service;

import com.edms.dto.ContentIndexRebuildResponse;
import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.model.ExtractionStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.apache.tika.sax.WriteOutContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class ContentExtractionService {

    private static final Logger log = LoggerFactory.getLogger(ContentExtractionService.class);
    public static final int MAX_EXTRACTED_CHARACTERS = 1_000_000;

    private static final Set<String> UNSUPPORTED_IMAGE_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg", ".tiff", ".ico"
    );

    private static final Set<String> UNSUPPORTED_BINARY_EXTENSIONS = Set.of(
            ".exe", ".bin", ".iso", ".zip", ".tar", ".gz", ".rar", ".7z"
    );

    private final FileStorageService fileStorageService;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentRepository documentRepository;

    @Autowired
    public ContentExtractionService(FileStorageService fileStorageService,
                                   DocumentVersionRepository documentVersionRepository,
                                   DocumentRepository documentRepository) {
        this.fileStorageService = fileStorageService;
        this.documentVersionRepository = documentVersionRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public DocumentVersion extractAndSaveById(Long versionId, boolean simulateFailure) {
        if (versionId == null) {
            return null;
        }

        DocumentVersion version = documentVersionRepository.findById(versionId).orElse(null);
        if (version == null) {
            log.warn("DocumentVersion #{} not found for content extraction", versionId);
            return null;
        }

        if (simulateFailure) {
            log.info("Simulating extraction failure for version #{} (Test Hook)", versionId);
            version.setExtractionStatus(ExtractionStatus.FAILED);
            version.setExtractionError("Cố ý mô phỏng lỗi trích xuất phục vụ kiểm thử giao dịch");
            version.setExtractedText(null);
            version.setExtractedCharacterCount(0);
            version.setExtractedAt(Instant.now());
            return documentVersionRepository.save(version);
        }

        return doExtraction(version);
    }

    @Transactional
    public DocumentVersion extractAndSave(DocumentVersion version) {
        if (version == null) {
            return null;
        }
        if (version.getId() != null) {
            return extractAndSaveById(version.getId(), false);
        }
        return doExtraction(version);
    }

    private DocumentVersion doExtraction(DocumentVersion version) {
        String fileName = version.getOriginalFileName() != null ? version.getOriginalFileName().toLowerCase() : "";
        String ext = getFileExtension(fileName);

        Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
        if (!Files.exists(filePath)) {
            version.setExtractionStatus(ExtractionStatus.FAILED);
            version.setExtractionError("Tệp vật lý không tồn tại trên hệ thống lưu trữ");
            version.setExtractedText(null);
            version.setExtractedCharacterCount(0);
            version.setExtractedAt(Instant.now());
            return documentVersionRepository.save(version);
        }

        // 1. Tika MIME Detection from binary magic bytes + filename metadata
        Tika tika = new Tika();
        String detectedMime = null;
        try (InputStream detectStream = Files.newInputStream(filePath)) {
            Metadata detectMeta = new Metadata();
            if (version.getOriginalFileName() != null) {
                detectMeta.set(TikaCoreProperties.RESOURCE_NAME_KEY, version.getOriginalFileName());
            }
            if (version.getContentType() != null && !version.getContentType().isBlank()) {
                detectMeta.set(org.apache.tika.metadata.HttpHeaders.CONTENT_TYPE, version.getContentType());
            }
            detectedMime = tika.detect(detectStream, detectMeta);
        } catch (Exception ex) {
            log.warn("MIME detection fallback for version ID #{}: {}", version.getId(), ex.getMessage());
        }

        if (detectedMime == null || detectedMime.isBlank() || "application/octet-stream".equalsIgnoreCase(detectedMime)) {
            if (version.getContentType() != null && !version.getContentType().isBlank()) {
                detectedMime = version.getContentType();
            } else {
                detectedMime = tika.detect(fileName);
            }
        }

        String lowerMime = detectedMime != null ? detectedMime.toLowerCase() : "";

        // 2. Check unsupported image formats (Tika detected MIME or filename extension)
        if (lowerMime.startsWith("image/") || UNSUPPORTED_IMAGE_EXTENSIONS.contains(ext)) {
            version.setExtractionStatus(ExtractionStatus.UNSUPPORTED);
            version.setExtractionError("Định dạng hình ảnh (" + lowerMime + ") chưa hỗ trợ trích xuất trong Phase 10 (cần OCR)");
            version.setExtractedText(null);
            version.setExtractedCharacterCount(0);
            version.setExtractedAt(Instant.now());
            return documentVersionRepository.save(version);
        }

        // 3. Check other unsupported binary/archive formats
        if (UNSUPPORTED_BINARY_EXTENSIONS.contains(ext) || lowerMime.contains("zip") || lowerMime.contains("tar") || (lowerMime.contains("octet-stream") && UNSUPPORTED_BINARY_EXTENSIONS.contains(ext))) {
            version.setExtractionStatus(ExtractionStatus.UNSUPPORTED);
            version.setExtractionError("Định dạng tệp nhị phân/nén không hỗ trợ trích xuất văn bản");
            version.setExtractedText(null);
            version.setExtractedCharacterCount(0);
            version.setExtractedAt(Instant.now());
            return documentVersionRepository.save(version);
        }

        // 4. Bounded stream parsing with WriteOutContentHandler limited to MAX_EXTRACTED_CHARACTERS
        try (InputStream inputStream = Files.newInputStream(filePath)) {
            WriteOutContentHandler writeOutHandler = new WriteOutContentHandler(MAX_EXTRACTED_CHARACTERS);
            BodyContentHandler handler = new BodyContentHandler(writeOutHandler);
            AutoDetectParser parser = new AutoDetectParser();
            Metadata metadata = new Metadata();
            ParseContext context = new ParseContext();

            boolean limitReached = false;
            try {
                parser.parse(inputStream, handler, metadata, context);
            } catch (Exception e) {
                if (org.apache.tika.exception.WriteLimitReachedException.isWriteLimitReached(e)) {
                    limitReached = true;
                    log.info("Extraction reached MAX_EXTRACTED_CHARACTERS ({}) on version #{}, truncated safely", MAX_EXTRACTED_CHARACTERS, version.getId());
                } else {
                    throw e;
                }
            }

            String text = handler.toString();
            if (text == null || text.trim().isEmpty()) {
                version.setExtractedText("");
                version.setExtractedCharacterCount(0);
                version.setExtractionStatus(ExtractionStatus.READY);
                version.setExtractionError(null);
            } else {
                String cleaned = text.trim();
                version.setExtractedText(cleaned);
                version.setExtractedCharacterCount(cleaned.length());
                version.setExtractionStatus(ExtractionStatus.READY);
                version.setExtractionError(limitReached ? "Nội dung vượt quá giới hạn 1,000,000 ký tự (đã cắt tỉa)" : null);
            }
        } catch (Throwable ex) {
            log.warn("Text extraction failed for version ID #{}: {}", version.getId(), ex.getMessage());
            String msg = ex.getMessage();
            if (msg != null && (msg.toLowerCase().contains("password") || msg.toLowerCase().contains("encrypted"))) {
                version.setExtractionError("Tệp tin bị mã hóa hoặc có mật khẩu bảo vệ");
            } else {
                version.setExtractionError("Trích xuất nội dung thất bại: " + sanitizeError(msg));
            }
            version.setExtractionStatus(ExtractionStatus.FAILED);
            version.setExtractedText(null);
            version.setExtractedCharacterCount(0);
        }

        version.setExtractedAt(Instant.now());
        return documentVersionRepository.save(version);
    }

    public ContentIndexRebuildResponse rebuildCurrentVersionIndex(boolean force) {
        List<Document> documents = documentRepository.findAll();
        int total = documents.size();
        int processed = 0;
        int ready = 0;
        int failed = 0;
        int unsupported = 0;
        int skipped = 0;

        for (Document doc : documents) {
            int currentVerNumber = doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1;
            DocumentVersion currentVersion = documentVersionRepository
                    .findByDocumentIdAndVersionNumber(doc.getId(), currentVerNumber)
                    .orElse(null);

            if (currentVersion == null) {
                continue;
            }

            if (!force && currentVersion.getExtractionStatus() == ExtractionStatus.READY) {
                skipped++;
                continue;
            }

            DocumentVersion updated = extractAndSaveById(currentVersion.getId(), false);
            if (updated == null) {
                continue;
            }
            processed++;
            if (updated.getExtractionStatus() == ExtractionStatus.READY) {
                ready++;
            } else if (updated.getExtractionStatus() == ExtractionStatus.UNSUPPORTED) {
                unsupported++;
            } else if (updated.getExtractionStatus() == ExtractionStatus.FAILED) {
                failed++;
            }
        }

        return new ContentIndexRebuildResponse(total, processed, ready, failed, unsupported, skipped);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dotIdx = fileName.lastIndexOf('.');
        return dotIdx >= 0 ? fileName.substring(dotIdx).toLowerCase() : "";
    }

    private String sanitizeError(String message) {
        if (message == null || message.isBlank()) {
            return "Lỗi định dạng tệp";
        }
        String sanitized = message.replaceAll("(?i)[a-z]:[\\\\/][^\\s]+", "[path]")
                .replaceAll("(?i)/[^\\s]+", "[path]");
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 200) + "...";
        }
        return sanitized;
    }
}
