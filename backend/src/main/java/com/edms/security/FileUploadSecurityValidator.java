package com.edms.security;

import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

/**
 * Phase 17: Upload Security & Abuse Protection.
 *
 * Implements:
 * 1. File size limits (max 20MB).
 * 2. Strict rejection of dangerous executables and scripts (.exe, .dll, .bat, .cmd, .ps1, .sh, .jar, etc.).
 * 3. Double-extension attack detection (e.g. invoice.pdf.exe, report.docx.bat).
 * 4. Magic-byte MIME detection via Apache Tika to block disguised executables (e.g. exe renamed to pdf).
 * 5. Path traversal rejection (../, ..\, null bytes, control characters).
 * 6. Active content rejection (.html, .htm, .svg) to eliminate stored XSS in EDMS origin.
 */
@Component
public class FileUploadSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(FileUploadSecurityValidator.class);

    public static final long MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            ".exe", ".dll", ".bat", ".cmd", ".ps1", ".sh", ".bash", ".jar", ".class",
            ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh", ".msc", ".msi", ".msp",
            ".scr", ".pif", ".com", ".cpl", ".hta", ".py", ".pyw", ".rb", ".php",
            ".phtml", ".php3", ".php4", ".php5", ".php7", ".phps", ".asp", ".aspx",
            ".jsp", ".jspx", ".cgi", ".pl", ".iso", ".elf"
    );

    private static final Set<String> ACTIVE_WEB_EXTENSIONS = Set.of(
            ".html", ".htm", ".xhtml", ".shtml", ".svg"
    );

    private static final Set<String> DANGEROUS_MIME_PATTERNS = Set.of(
            "application/x-dosexec",
            "application/x-executable",
            "application/x-sharedlib",
            "application/x-sh",
            "application/x-shellscript",
            "application/x-bat",
            "application/x-msdownload",
            "application/x-ms-installer",
            "application/java-archive",
            "application/x-java-applet",
            "application/x-javascript",
            "text/javascript",
            "text/html",
            "image/svg+xml",
            "application/xhtml+xml"
    );

    private final Tika tika = new Tika();

    public void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được để trống.");
        }

        // 1. File size validation
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Kích thước tệp (" + (file.getSize() / 1024 / 1024) + "MB) vượt quá giới hạn tối đa 20MB.");
        }

        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.isBlank()) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ.");
        }

        // 2. Control character & null-byte check
        for (int i = 0; i < rawFilename.length(); i++) {
            char c = rawFilename.charAt(i);
            if (c == '\0' || c < 0x20) {
                log.warn("Null byte or control character detected in filename: '{}'", rawFilename);
                throw new IllegalArgumentException("Tên tệp chứa ký tự điều khiển hoặc null-byte không hợp lệ.");
            }
        }

        // 3. Path traversal detection in original filename
        if (rawFilename.contains("..") || rawFilename.contains("/") || rawFilename.contains("\\")) {
            log.warn("Path traversal sequence detected in filename: '{}'", rawFilename);
            throw new IllegalArgumentException("Tên tệp chứa đường dẫn hoặc chuỗi duyệt thư mục (path traversal) không hợp lệ.");
        }

        String lowerFilename = rawFilename.toLowerCase(Locale.ROOT);

        // 4. Double extension and dangerous extension detection
        String[] parts = lowerFilename.split("\\.");
        if (parts.length > 2) {
            // Check if any intermediate or final extension is dangerous
            for (int i = 1; i < parts.length; i++) {
                String subExt = "." + parts[i];
                if (DANGEROUS_EXTENSIONS.contains(subExt) || ACTIVE_WEB_EXTENSIONS.contains(subExt)) {
                    log.warn("Dangerous extension detected in multi-part filename '{}': {}", rawFilename, subExt);
                    throw new IllegalArgumentException("Tệp tin chứa phần mở rộng nguy hiểm không được phép: " + subExt);
                }
            }
        } else if (parts.length == 2) {
            String ext = "." + parts[1];
            if (DANGEROUS_EXTENSIONS.contains(ext)) {
                log.warn("Dangerous file extension rejected: '{}'", rawFilename);
                throw new IllegalArgumentException("Định dạng tệp không được phép tải lên: " + ext);
            }
            if (ACTIVE_WEB_EXTENSIONS.contains(ext)) {
                log.warn("Active web content rejected: '{}'", rawFilename);
                throw new IllegalArgumentException("Định dạng HTML/SVG có chứa script chủ động không được phép tải lên: " + ext);
            }
        }

        // 5. Magic-byte detection via Apache Tika
        try (InputStream is = file.getInputStream()) {
            Metadata metadata = new Metadata();
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, rawFilename);
            String detectedMime = tika.detect(is, metadata);

            if (detectedMime != null) {
                String lowerMime = detectedMime.toLowerCase(Locale.ROOT);

                // Reject executable binaries disguised as documents
                for (String dangerousMime : DANGEROUS_MIME_PATTERNS) {
                    if (lowerMime.contains(dangerousMime) || lowerMime.startsWith(dangerousMime)) {
                        log.warn("Disguised executable/dangerous MIME detected for file '{}': {}", rawFilename, detectedMime);
                        throw new IllegalArgumentException("Nội dung tệp chứa mã thực thi nguy hiểm hoặc nội dung không hợp lệ: " + detectedMime);
                    }
                }

                // Check MIME mismatch for common types (e.g. .pdf claiming pdf but detected as something hazardous)
                if (lowerFilename.endsWith(".pdf") && (lowerMime.contains("dosexec") || lowerMime.contains("executable") || lowerMime.contains("html"))) {
                    log.warn("MIME mismatch: file '{}' claims PDF but detected as '{}'", rawFilename, detectedMime);
                    throw new IllegalArgumentException("Phát hiện bất thường nội dung: tệp tin không khớp với định dạng PDF đã khai báo.");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Error during magic-byte detection on file '{}': {}", rawFilename, e.getMessage());
        }
    }
}
