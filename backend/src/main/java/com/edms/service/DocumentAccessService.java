package com.edms.service;

import com.edms.entity.AccessMode;
import com.edms.entity.Document;
import com.edms.entity.LifecycleStatus;
import com.edms.entity.PermissionType;
import com.edms.entity.User;
import com.edms.repository.DocumentPermissionRepository;
import com.edms.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class DocumentAccessService {

    private final UserRepository userRepository;
    private final DocumentPermissionRepository documentPermissionRepository;

    public DocumentAccessService(UserRepository userRepository,
                                 DocumentPermissionRepository documentPermissionRepository) {
        this.userRepository = userRepository;
        this.documentPermissionRepository = documentPermissionRepository;
    }

    @Transactional(readOnly = true)
    public boolean canRead(Document doc, String username, boolean isAdmin) {
        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            return isAdmin;
        }
        if (isAdmin) {
            return true;
        }
        if (username != null && username.equalsIgnoreCase(doc.getCreatedBy())) {
            return true;
        }
        if (doc.getAccessMode() == AccessMode.INTERNAL) {
            return true;
        }
        if (username == null || username.isBlank() || "anonymous".equalsIgnoreCase(username)) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !userOpt.get().isEnabled()) {
            return false;
        }

        return documentPermissionRepository.findPermission(doc.getId(), userOpt.get().getId()).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean canEdit(Document doc, String username, boolean isAdmin) {
        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            return false;
        }
        if (isAdmin) {
            return true;
        }
        if (username != null && username.equalsIgnoreCase(doc.getCreatedBy())) {
            return true;
        }
        if (username == null || username.isBlank() || "anonymous".equalsIgnoreCase(username)) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !userOpt.get().isEnabled()) {
            return false;
        }

        Optional<PermissionType> permOpt = documentPermissionRepository.findPermission(doc.getId(), userOpt.get().getId());
        return permOpt.isPresent() && permOpt.get() == PermissionType.EDIT;
    }

    public boolean canShare(Document doc, String username, boolean isAdmin) {
        if (isAdmin) {
            return true;
        }
        return username != null && username.equalsIgnoreCase(doc.getCreatedBy());
    }

    public boolean canChangeAccessMode(Document doc, String username, boolean isAdmin) {
        return canShare(doc, username, isAdmin);
    }

    @Transactional(readOnly = true)
    public void requireRead(Document doc, String username, boolean isAdmin) {
        if (!canRead(doc, username, isAdmin)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập tài liệu này");
        }
    }

    @Transactional(readOnly = true)
    public void requireEdit(Document doc, String username, boolean isAdmin) {
        if (!canEdit(doc, username, isAdmin)) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật tài liệu này");
        }
    }

    public void requireShare(Document doc, String username, boolean isAdmin) {
        if (!canShare(doc, username, isAdmin)) {
            throw new AccessDeniedException("Bạn không có quyền chia sẻ hoặc quản lý quyền của tài liệu này");
        }
    }

    public void requireChangeAccessMode(Document doc, String username, boolean isAdmin) {
        if (!canChangeAccessMode(doc, username, isAdmin)) {
            throw new AccessDeniedException("Bạn không có quyền thay đổi chế độ truy cập của tài liệu này");
        }
    }

    public boolean canArchive(Document doc, String username, boolean isAdmin) {
        if (isAdmin) {
            return true;
        }
        return username != null && username.equalsIgnoreCase(doc.getCreatedBy());
    }

    public boolean canUnarchive(Document doc, String username, boolean isAdmin) {
        return canArchive(doc, username, isAdmin);
    }

    public void requireArchive(Document doc, String username, boolean isAdmin) {
        if (!canArchive(doc, username, isAdmin)) {
            throw new AccessDeniedException("Chỉ quản trị viên hoặc chủ sở hữu mới có quyền lưu trữ tài liệu này");
        }
    }

    public void requireUnarchive(Document doc, String username, boolean isAdmin) {
        if (!canUnarchive(doc, username, isAdmin)) {
            throw new AccessDeniedException("Chỉ quản trị viên hoặc chủ sở hữu mới có quyền khôi phục hoạt động cho tài liệu này");
        }
    }

    public boolean canRequestDisposition(Document doc, String username, boolean isAdmin) {
        if (isAdmin) {
            return true;
        }
        return username != null && username.equalsIgnoreCase(doc.getCreatedBy());
    }

    public void requireRequestDisposition(Document doc, String username, boolean isAdmin) {
        if (!canRequestDisposition(doc, username, isAdmin)) {
            throw new AccessDeniedException("Chỉ quản trị viên hoặc chủ sở hữu mới có quyền yêu cầu tiêu hủy tài liệu này");
        }
    }

    @Transactional(readOnly = true)
    public String getUserPermissionLevel(Document doc, String username, boolean isAdmin) {
        if (doc.getLifecycleStatus() == LifecycleStatus.DISPOSED) {
            return isAdmin ? "ADMIN" : "NONE";
        }
        if (isAdmin) {
            return "ADMIN";
        }
        if (username != null && username.equalsIgnoreCase(doc.getCreatedBy())) {
            return "OWNER";
        }
        if (username != null) {
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                Optional<PermissionType> perm = documentPermissionRepository.findPermission(doc.getId(), userOpt.get().getId());
                if (perm.isPresent()) {
                    return perm.get().name();
                }
            }
        }
        if (doc.getAccessMode() == AccessMode.INTERNAL) {
            return "READ";
        }
        return "NONE";
    }
}
