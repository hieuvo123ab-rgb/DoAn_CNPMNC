package com.edms.service;

import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.edms.entity.LifecycleStatus;
import com.edms.model.ExtractionStatus;
import com.edms.model.OcrStatus;
import com.edms.repository.DocumentRepository;
import com.edms.repository.DocumentVersionRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    public static final int OCR_MIN_NATIVE_TEXT_CHARS = 50;
    public static final int MAX_OCR_CHARACTERS = 1_000_000;
    public static final int MAX_OCR_PDF_PAGES = 50;
    public static final int OCR_PAGE_TIMEOUT_SECONDS = 30;
    public static final int OCR_DOCUMENT_TIMEOUT_SECONDS = 180;
    public static final long MAX_OCR_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private static final Set<String> SUPPORTED_IMAGE_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp"
    );

    private static final Set<String> SUPPORTED_IMAGE_MIMES = Set.of(
            "image/png", "image/jpeg", "image/webp", "image/tiff", "image/bmp"
    );

    private final FileStorageService fileStorageService;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentRepository documentRepository;
    private final AuditService auditService;
    private final ThreadPoolExecutor ocrExecutor;

    @Autowired
    public OcrService(FileStorageService fileStorageService,
                      DocumentVersionRepository documentVersionRepository,
                      DocumentRepository documentRepository,
                      AuditService auditService) {
        this.fileStorageService = fileStorageService;
        this.documentVersionRepository = documentVersionRepository;
        this.documentRepository = documentRepository;
        this.auditService = auditService;

        // Bounded thread pool: 2 core, 4 max, 50 queue capacity
        this.ocrExecutor = new ThreadPoolExecutor(
                2, 4, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(50),
                new ThreadFactory() {
                    private int count = 1;
                    @Override
                    public Thread newThread(Runnable r) {
                        Thread t = new Thread(r, "ocr-exec-" + (count++));
                        t.setDaemon(true);
                        return t;
                    }
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    /**
     * Determine whether a document version is eligible for OCR fallback.
     */
    public boolean isOcrEligible(DocumentVersion version) {
        if (version == null) return false;

        // Never OCR if document is disposed
        if (version.getDocument() != null && version.getDocument().getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            return false;
        }

        String fileName = version.getOriginalFileName() != null ? version.getOriginalFileName().toLowerCase() : "";
        String contentType = version.getContentType() != null ? version.getContentType().toLowerCase() : "";

        boolean isImage = SUPPORTED_IMAGE_EXTENSIONS.stream().anyMatch(fileName::endsWith)
                || SUPPORTED_IMAGE_MIMES.contains(contentType)
                || contentType.startsWith("image/");

        boolean isPdf = fileName.endsWith(".pdf") || "application/pdf".equalsIgnoreCase(contentType);

        if (!isImage && !isPdf && version.getStoredFileName() != null) {
            try {
                Path filePath = fileStorageService.getFilePath(version.getStoredFileName());
                if (Files.exists(filePath)) {
                    Tika tika = new Tika();
                    try (InputStream is = Files.newInputStream(filePath)) {
                        String detected = tika.detect(is, version.getOriginalFileName());
                        if (detected != null) {
                            String lowerDetected = detected.toLowerCase();
                            if (lowerDetected.startsWith("image/") || SUPPORTED_IMAGE_MIMES.contains(lowerDetected)) {
                                isImage = true;
                            } else if ("application/pdf".equalsIgnoreCase(lowerDetected)) {
                                isPdf = true;
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to detect MIME type for version #{}: {}", version.getId(), ex.getMessage());
            }
        }

        // 1. Image formats: always eligible for OCR (since native text is UNSUPPORTED)
        if (isImage) {
            return true;
        }

        // 2. PDF: eligible only if native extracted text lacks meaningful content (< OCR_MIN_NATIVE_TEXT_CHARS)
        if (isPdf) {
            String nativeText = version.getExtractedText();
            if (nativeText == null) {
                return true;
            }
            String normalized = nativeText.replaceAll("\\s+", " ").trim();
            return normalized.length() < OCR_MIN_NATIVE_TEXT_CHARS;
        }

        return false;
    }

    /**
     * Submit an OCR task asynchronously to the bounded executor.
     */
    public void queueOcrAsync(Long versionId) {
        evaluateAndQueueOcr(versionId, false);
    }

    /**
     * Evaluate eligibility and queue OCR asynchronously (or run synchronously if requested).
     */
    public void evaluateAndQueueOcr(Long versionId, boolean sync) {
        evaluateAndQueueOcr(versionId, sync, false);
    }

    public void evaluateAndQueueOcr(Long versionId, boolean sync, boolean forceTimeout) {
        DocumentVersion version = documentVersionRepository.findById(versionId).orElse(null);
        if (version == null) return;

        if (!isOcrEligible(version)) {
            version.setOcrStatus(OcrStatus.NOT_REQUIRED);
            documentVersionRepository.save(version);
            return;
        }

        version.setOcrStatus(OcrStatus.PENDING);
        documentVersionRepository.save(version);

        if (sync) {
            processOcr(versionId, forceTimeout);
        } else {
            ocrExecutor.submit(() -> processOcr(versionId, forceTimeout));
        }
    }

    /**
     * Process OCR for a DocumentVersion synchronously (used by async task, tests, and admin rebuild).
     */
    public DocumentVersion processOcr(Long versionId) {
        return processOcr(versionId, false);
    }

    public DocumentVersion processOcr(Long versionId, boolean forceTimeout) {
        Optional<DocumentVersion> optVersion = documentVersionRepository.findById(versionId);
        if (optVersion.isEmpty()) {
            log.warn("Cannot process OCR: DocumentVersion #{} not found", versionId);
            return null;
        }

        DocumentVersion version = optVersion.get();
        if (!isOcrEligible(version)) {
            version.setOcrStatus(OcrStatus.NOT_REQUIRED);
            return documentVersionRepository.save(version);
        }

        Path filePath;
        try {
            filePath = fileStorageService.loadFileAsResource(version.getStoredFileName()).getFile().toPath();
        } catch (Exception e) {
            log.warn("OCR failed to load file for version #{}: {}", versionId, e.getMessage());
            version.setOcrStatus(OcrStatus.FAILED);
            version.setOcrError("Không thể tải tệp tin vật lý để xử lý OCR");
            version.setOcrAt(Instant.now());
            return documentVersionRepository.save(version);
        }

        // Check file size
        try {
            if (Files.size(filePath) > MAX_OCR_FILE_SIZE) {
                log.warn("OCR skipped for version #{}: File size exceeds {} MB limit", versionId, MAX_OCR_FILE_SIZE / (1024 * 1024));
                version.setOcrStatus(OcrStatus.SKIPPED);
                version.setOcrError("Kích thước tệp vượt quá giới hạn OCR (tối đa 50MB)");
                version.setOcrAt(Instant.now());
                return documentVersionRepository.save(version);
            }
        } catch (IOException ignored) {
        }

        String fileName = version.getOriginalFileName() != null ? version.getOriginalFileName().toLowerCase() : "";
        String contentType = version.getContentType() != null ? version.getContentType().toLowerCase() : "";
        boolean isPdf = fileName.endsWith(".pdf") || "application/pdf".equalsIgnoreCase(contentType);
        if (!isPdf && !fileName.endsWith(".png") && !fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && !fileName.endsWith(".webp") && !fileName.endsWith(".tiff")) {
            try {
                Tika tika = new Tika();
                try (InputStream is = Files.newInputStream(filePath)) {
                    String detected = tika.detect(is, version.getOriginalFileName());
                    if ("application/pdf".equalsIgnoreCase(detected)) {
                        isPdf = true;
                    }
                }
            } catch (Exception ignored) {}
        }

        Path tempDir = null;
        try {
            if (forceTimeout) {
                throw new TimeoutException("Tesseract OCR process timed out after " + OCR_DOCUMENT_TIMEOUT_SECONDS + " seconds");
            }
            tempDir = Files.createTempDirectory("edms_ocr_work_");
            String ocrTextResult;
            String detectedLanguage = "vie+eng";

            if (isPdf) {
                ocrTextResult = renderAndOcrPdf(filePath, tempDir);
            } else {
                ocrTextResult = ocrSingleImage(filePath, tempDir);
            }

            if (ocrTextResult == null || ocrTextResult.trim().isEmpty()) {
                version.setOcrStatus(OcrStatus.READY);
                version.setOcrText("");
                version.setOcrCharacterCount(0);
                version.setOcrLanguage(detectedLanguage);
                version.setOcrError(null);
            } else {
                String cleaned = ocrTextResult.trim();
                boolean truncated = false;
                if (cleaned.length() > MAX_OCR_CHARACTERS) {
                    cleaned = cleaned.substring(0, MAX_OCR_CHARACTERS);
                    truncated = true;
                }
                version.setOcrStatus(OcrStatus.READY);
                version.setOcrText(cleaned);
                version.setOcrCharacterCount(cleaned.length());
                version.setOcrLanguage(detectedLanguage);
                version.setOcrError(truncated ? "Nội dung OCR vượt quá giới hạn 1,000,000 ký tự (đã cắt tỉa)" : null);
            }
            version.setOcrAt(Instant.now());
            log.info("OCR completed successfully for version #{}: {} chars extracted, status READY", versionId, version.getOcrCharacterCount());
        } catch (PageLimitExceededException ple) {
            log.warn("OCR skipped for version #{}: {}", versionId, ple.getMessage());
            version.setOcrStatus(OcrStatus.SKIPPED);
            version.setOcrError("Số trang vượt quá giới hạn OCR (tối đa " + MAX_OCR_PDF_PAGES + " trang)");
            version.setOcrAt(Instant.now());
        } catch (TimeoutException te) {
            log.warn("OCR timed out for version #{}: {}", versionId, te.getMessage());
            version.setOcrStatus(OcrStatus.FAILED);
            version.setOcrError("Quá trình nhận diện OCR bị gián đoạn do vượt quá thời gian chờ");
            version.setOcrAt(Instant.now());
        } catch (Throwable ex) {
            log.warn("OCR failed for version #{}: {}", versionId, ex.getMessage());
            version.setOcrStatus(OcrStatus.FAILED);
            version.setOcrError("Nhận dạng quang học OCR thất bại: " + sanitizeError(ex.getMessage()));
            version.setOcrAt(Instant.now());
        } finally {
            if (tempDir != null) {
                cleanupDirectory(tempDir);
            }
        }

        return documentVersionRepository.save(version);
    }

    /**
     * Perform OCR on a single image file.
     */
    private String ocrSingleImage(Path imagePath, Path tempDir) throws Exception {
        Path tempOutputBase = tempDir.resolve("ocr_out_" + UUID.randomUUID().toString());
        return runTesseract(imagePath, tempOutputBase, OCR_PAGE_TIMEOUT_SECONDS);
    }

    /**
     * Render PDF pages to images using PDFBox and perform OCR page by page.
     */
    private String renderAndOcrPdf(Path pdfPath, Path tempDir) throws Exception {
        long startTime = System.currentTimeMillis();
        StringBuilder combinedText = new StringBuilder();

        try (PDDocument pdDoc = PDDocument.load(pdfPath.toFile())) {
            if (pdDoc.isEncrypted()) {
                throw new IllegalArgumentException("Tệp tin PDF bị mã hóa hoặc có mật khẩu bảo vệ");
            }

            int totalPages = pdDoc.getNumberOfPages();
            if (totalPages > MAX_OCR_PDF_PAGES) {
                throw new PageLimitExceededException("Tài liệu PDF có " + totalPages + " trang, vượt quá giới hạn " + MAX_OCR_PDF_PAGES + " trang");
            }

            PDFRenderer renderer = new PDFRenderer(pdDoc);
            for (int page = 0; page < totalPages; page++) {
                long elapsedSeconds = (System.currentTimeMillis() - startTime) / 1000;
                if (elapsedSeconds > OCR_DOCUMENT_TIMEOUT_SECONDS) {
                    throw new TimeoutException("Tổng thời gian xử lý OCR tài liệu PDF vượt quá " + OCR_DOCUMENT_TIMEOUT_SECONDS + " giây");
                }

                Path pageImage = tempDir.resolve("page_" + page + "_" + UUID.randomUUID().toString() + ".png");
                try {
                    // Render page at 200 DPI for good OCR accuracy
                    BufferedImage image = renderer.renderImageWithDPI(page, 200, ImageType.RGB);
                    ImageIO.write(image, "PNG", pageImage.toFile());

                    Path pageOutputBase = tempDir.resolve("page_out_" + page + "_" + UUID.randomUUID().toString());
                    String pageText = runTesseract(pageImage, pageOutputBase, OCR_PAGE_TIMEOUT_SECONDS);
                    if (pageText != null && !pageText.trim().isEmpty()) {
                        if (combinedText.length() > 0) {
                            combinedText.append("\n\n");
                        }
                        combinedText.append(pageText.trim());
                    }
                } finally {
                    try {
                        Files.deleteIfExists(pageImage);
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        return combinedText.toString();
    }

    /**
     * Execute Tesseract CLI safely using ProcessBuilder (No shell interpolation).
     */
    public String runTesseract(Path inputImagePath, Path outputBase, int timeoutSeconds) throws Exception {
        // Try with vie+eng first; fallback to eng if vie language package is missing
        String language = "vie+eng";
        String result = executeTesseractProcess(inputImagePath, outputBase, language, timeoutSeconds);
        if (result == null) {
            result = executeTesseractProcess(inputImagePath, outputBase, "eng", timeoutSeconds);
        }
        if (result == null) {
            throw new RuntimeException("Tesseract OCR process failed to process image file");
        }
        return result;
    }

    private String executeTesseractProcess(Path inputImagePath, Path outputBase, String lang, int timeoutSeconds) throws Exception {
        List<String> command = List.of(
                "tesseract",
                inputImagePath.toAbsolutePath().toString(),
                outputBase.toAbsolutePath().toString(),
                "-l", lang
        );

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process;
        try {
            process = pb.start();
        } catch (IOException e) {
            log.warn("Tesseract executable not found or failed to start: {}", e.getMessage());
            throw new RuntimeException("Tesseract OCR engine không khả dụng: " + e.getMessage(), e);
        }

        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new TimeoutException("Tesseract process timed out after " + timeoutSeconds + " seconds");
        }

        int exitCode = process.exitValue();
        if (exitCode != 0) {
            log.debug("Tesseract exited with non-zero code {} for language {}", exitCode, lang);
            Path expectedTextFile = outputBase.getParent().resolve(outputBase.getFileName().toString() + ".txt");
            try {
                Files.deleteIfExists(expectedTextFile);
            } catch (Exception ignored) {
            }
            return null; // Signals failure or fallback attempt
        }

        Path expectedTextFile = outputBase.getParent().resolve(outputBase.getFileName().toString() + ".txt");
        if (Files.exists(expectedTextFile)) {
            try {
                return Files.readString(expectedTextFile, StandardCharsets.UTF_8);
            } finally {
                try {
                    Files.deleteIfExists(expectedTextFile);
                } catch (Exception ignored) {
                }
            }
        }

        return "";
    }

    private String sanitizeError(String msg) {
        if (msg == null) return "Lỗi không xác định";
        String clean = msg.replaceAll("(?i)[a-z]:\\\\[^\\s]+", "[path]")
                .replaceAll("(?i)/app/[^\\s]+", "[path]")
                .replaceAll("(?i)/tmp/[^\\s]+", "[path]");
        return clean.length() > 200 ? clean.substring(0, 200) + "..." : clean;
    }

    private void cleanupDirectory(Path dir) {
        try {
            if (Files.exists(dir)) {
                try (var stream = Files.walk(dir)) {
                    stream.sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                }
            }
        } catch (Exception e) {
            log.debug("Failed to fully clean up temp dir {}: {}", dir, e.getMessage());
        }
    }

    public com.edms.dto.OcrIndexRebuildResponse rebuildOcrIndex(boolean force, String adminUsername) {
        List<Document> allDocs = documentRepository.findAll();
        int total = allDocs.size();
        int eligible = 0;
        int queued = 0;
        int ready = 0;
        int failed = 0;
        int skipped = 0;

        for (Document doc : allDocs) {
            // Skip disposed documents
            if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
                skipped++;
                continue;
            }

            Integer curVerNum = doc.getCurrentVersionNumber() != null ? doc.getCurrentVersionNumber() : 1;
            Optional<DocumentVersion> optVer = documentVersionRepository.findByDocumentIdAndVersionNumber(doc.getId(), curVerNum);
            if (optVer.isEmpty()) {
                skipped++;
                continue;
            }

            DocumentVersion version = optVer.get();
            if (!isOcrEligible(version)) {
                version.setOcrStatus(OcrStatus.NOT_REQUIRED);
                documentVersionRepository.save(version);
                skipped++;
                continue;
            }

            eligible++;
            if (!force && version.getOcrStatus() != null && version.getOcrStatus() != OcrStatus.PENDING) {
                skipped++;
                if (version.getOcrStatus() == OcrStatus.READY) {
                    ready++;
                } else if (version.getOcrStatus() == OcrStatus.FAILED) {
                    failed++;
                }
                continue;
            }

            queued++;
            try {
                DocumentVersion processed = processOcr(version.getId());
                if (processed != null && processed.getOcrStatus() == OcrStatus.READY) {
                    ready++;
                } else if (processed != null && processed.getOcrStatus() == OcrStatus.SKIPPED) {
                    skipped++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                log.warn("Rebuild OCR failed on version ID #{}: {}", version.getId(), e.getMessage());
                failed++;
            }
        }

        auditService.log(adminUsername, "OCR_INDEX_REBUILD", "SYSTEM", "ALL",
                adminUsername + " thực hiện Rebuild OCR Index: total=" + total + ", eligible=" + eligible + ", queued=" + queued + ", ready=" + ready + ", failed=" + failed, null);

        return new com.edms.dto.OcrIndexRebuildResponse(total, eligible, queued, ready, failed, skipped);
    }

    public boolean retryOcr(Long versionId, boolean sync, String adminUsername) {
        DocumentVersion version = documentVersionRepository.findById(versionId).orElse(null);
        if (version == null) return false;

        auditService.log(adminUsername, "OCR_RETRY", "VERSION", versionId.toString(),
                adminUsername + " kích hoạt thử lại OCR cho phiên bản #" + versionId, null);

        version.setOcrStatus(OcrStatus.PENDING);
        documentVersionRepository.save(version);

        if (sync) {
            processOcr(versionId);
            return true;
        } else {
            ocrExecutor.submit(() -> processOcr(versionId));
            return true;
        }
    }

    public static class PageLimitExceededException extends RuntimeException {
        public PageLimitExceededException(String message) {
            super(message);
        }
    }
}
