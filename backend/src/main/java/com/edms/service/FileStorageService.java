package com.edms.service;

import com.edms.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageLocation;
    private final com.edms.security.FileUploadSecurityValidator fileUploadSecurityValidator;

    public FileStorageService(@Value("${edms.storage.upload-dir:/app/storage/uploads}") String uploadDir,
                              com.edms.security.FileUploadSecurityValidator fileUploadSecurityValidator) {
        this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileUploadSecurityValidator = fileUploadSecurityValidator;
        try {
            Files.createDirectories(this.storageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create storage directory at " + uploadDir, ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Phase 17: Comprehensive security validation (extensions, magic-bytes, traversal, active web content)
        fileUploadSecurityValidator.validateUpload(file);

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        if (originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }

        // Server-controlled random UUID + timestamp filename; user-controlled filename is never stored directly
        String storedFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

        try {
            Path targetLocation = this.storageLocation.resolve(storedFileName).normalize();
            if (!targetLocation.startsWith(this.storageLocation)) {
                throw new SecurityException("Thư mục lưu trữ không hợp lệ: " + storedFileName);
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + originalFileName, ex);
        }
    }

    public Path getFilePath(String storedFileName) {
        if (storedFileName == null || storedFileName.contains("..") || storedFileName.contains("\0")) {
            throw new IllegalArgumentException("Invalid stored filename");
        }
        return this.storageLocation.resolve(storedFileName).normalize();
    }

    public Resource loadFileAsResource(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()) {
            throw new ResourceNotFoundException("Tên tệp không hợp lệ");
        }
        if (storedFileName.contains("..") || storedFileName.contains("/") || storedFileName.contains("\\") || storedFileName.contains("\0")) {
            throw new ResourceNotFoundException("Đường dẫn tệp không hợp lệ (path traversal rejected): " + storedFileName);
        }
        try {
            Path filePath = getFilePath(storedFileName);
            if (!filePath.startsWith(this.storageLocation)) {
                throw new ResourceNotFoundException("Truy cập tệp ngoài thư mục lưu trữ bị từ chối: " + storedFileName);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable() && !Files.isDirectory(filePath)) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Tệp vật lý không tồn tại hoặc không thể đọc: " + storedFileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Đường dẫn tệp không hợp lệ: " + storedFileName);
        }
    }

    public String copyStoredFile(String sourceStoredFileName, String originalFileName) {
        Path sourcePath = getFilePath(sourceStoredFileName);
        if (!Files.exists(sourcePath)) {
            throw new ResourceNotFoundException("Tệp nguồn không tồn tại: " + sourceStoredFileName);
        }

        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String newStoredFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;
        Path targetPath = this.storageLocation.resolve(newStoredFileName);

        try {
            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return newStoredFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to duplicate file for new version: " + sourceStoredFileName, ex);
        }
    }

    public boolean deleteStoredFile(String storedFileName) {
        try {
            Path filePath = getFilePath(storedFileName);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            return false;
        }
    }
}
