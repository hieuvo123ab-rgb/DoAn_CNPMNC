package com.edms.service;

import com.edms.dto.CreateUserRequest;
import com.edms.dto.RolePermissionMatrixResponse;
import com.edms.dto.UpdateUserRequest;
import com.edms.dto.UserResponse;
import com.edms.entity.Role;
import com.edms.entity.User;
import com.edms.exception.ResourceNotFoundException;
import com.edms.exception.UserAlreadyExistsException;
import com.edms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "system";
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Tên đăng nhập '" + username + "' đã tồn tại trong hệ thống.");
        }

        if (request.getRole() == null) {
            throw new IllegalArgumentException("Vai trò người dùng không hợp lệ.");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(
                username,
                encodedPassword,
                request.getFullName() != null ? request.getFullName().trim() : null,
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getRole()
        );

        User savedUser = userRepository.save(user);
        auditService.log(getCurrentUsername(), "USER_CREATE", "USER", savedUser.getId().toString(),
                "Tạo người dùng mới: " + savedUser.getUsername() + " (" + savedUser.getRole() + ")", null);
        return UserResponse.fromEntity(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // Self-Modification & Last Active Admin Guard
        boolean isCurrentlyActiveAdmin = user.getRole() == Role.ROLE_ADMIN && user.isEnabled();
        boolean willBeDisabled = request.getEnabled() != null && !request.getEnabled();
        boolean willBeDemoted = request.getRole() != null && request.getRole() != Role.ROLE_ADMIN;

        if (isCurrentlyActiveAdmin && (willBeDisabled || willBeDemoted)) {
            long activeAdmins = userRepository.countByRoleAndEnabledTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new IllegalArgumentException("Không thể vô hiệu hóa hoặc hạ quyền Quản trị viên (Admin) duy nhất còn hoạt động trong hệ thống.");
            }
        }

        boolean roleChanged = request.getRole() != null && request.getRole() != user.getRole();

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        User saved = userRepository.save(user);
        String action = roleChanged ? "USER_ROLE_CHANGE" : "USER_UPDATE";
        auditService.log(getCurrentUsername(), action, "USER", saved.getId().toString(),
                "Cập nhật người dùng: " + saved.getUsername() + (roleChanged ? " sang vai trò " + saved.getRole() : ""), null);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public UserResponse setUserStatus(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // Last Active Admin Guard
        if (!enabled && user.getRole() == Role.ROLE_ADMIN && user.isEnabled()) {
            long activeAdmins = userRepository.countByRoleAndEnabledTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new IllegalArgumentException("Không thể vô hiệu hóa Quản trị viên (Admin) duy nhất còn hoạt động trong hệ thống.");
            }
        }

        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        String action = enabled ? "USER_ENABLE" : "USER_DISABLE";
        auditService.log(getCurrentUsername(), action, "USER", saved.getId().toString(),
                (enabled ? "Kích hoạt" : "Vô hiệu hóa") + " tài khoản: " + saved.getUsername(), null);
        return UserResponse.fromEntity(saved);
    }

    public RolePermissionMatrixResponse getRolePermissionsMatrix() {
        Map<String, List<RolePermissionMatrixResponse.PermissionItem>> matrix = new LinkedHashMap<>();

        // ROLE_ADMIN permissions
        List<RolePermissionMatrixResponse.PermissionItem> adminPermissions = List.of(
                new RolePermissionMatrixResponse.PermissionItem("document:read", "Xem danh sách tài liệu", "Truy cập toàn bộ tài liệu lưu trữ trong hệ thống", true),
                new RolePermissionMatrixResponse.PermissionItem("document:upload", "Tải lên tài liệu", "Tải tài liệu mới và nhập metadata", true),
                new RolePermissionMatrixResponse.PermissionItem("document:update_all", "Cập nhật tất cả tài liệu", "Sửa thông tin metadata và phân loại của mọi tài liệu", true),
                new RolePermissionMatrixResponse.PermissionItem("document:download_preview", "Tải xuống & xem trước", "Tải tệp gốc hoặc xem trước trực tiếp trên trình duyệt", true),
                new RolePermissionMatrixResponse.PermissionItem("search:saved", "Lưu bộ lọc tìm kiếm", "Lưu trữ và tái sử dụng các điều kiện tìm kiếm cá nhân", true),
                new RolePermissionMatrixResponse.PermissionItem("user:read", "Xem danh sách người dùng", "Truy cập danh sách tài khoản và vai trò trong hệ thống", true),
                new RolePermissionMatrixResponse.PermissionItem("user:create", "Tạo tài khoản mới", "Khởi tạo tài khoản và mật khẩu cho người dùng mới", true),
                new RolePermissionMatrixResponse.PermissionItem("user:update", "Cập nhật & gán quyền", "Chỉnh sửa thông tin và thay đổi vai trò tài khoản", true),
                new RolePermissionMatrixResponse.PermissionItem("user:toggle_status", "Khóa / Mở khóa tài khoản", "Bật hoặc tắt trạng thái hoạt động của tài khoản", true),
                new RolePermissionMatrixResponse.PermissionItem("role:manage", "Quản lý vai trò & quyền hạn", "Xem và kiểm soát ma trận phân quyền hệ thống", true)
        );

        // ROLE_STAFF permissions
        List<RolePermissionMatrixResponse.PermissionItem> staffPermissions = List.of(
                new RolePermissionMatrixResponse.PermissionItem("document:read", "Xem danh sách tài liệu", "Truy cập toàn bộ tài liệu lưu trữ trong hệ thống", true),
                new RolePermissionMatrixResponse.PermissionItem("document:upload", "Tải lên tài liệu", "Tải tài liệu mới và nhập metadata", true),
                new RolePermissionMatrixResponse.PermissionItem("document:update_all", "Cập nhật tất cả tài liệu", "Sửa thông tin metadata của tài liệu người khác tạo", false),
                new RolePermissionMatrixResponse.PermissionItem("document:update_own", "Cập nhật tài liệu của mình", "Sửa thông tin metadata và phân loại tài liệu do chính mình tạo", true),
                new RolePermissionMatrixResponse.PermissionItem("document:download_preview", "Tải xuống & xem trước", "Tải tệp gốc hoặc xem trước trực tiếp trên trình duyệt", true),
                new RolePermissionMatrixResponse.PermissionItem("search:saved", "Lưu bộ lọc tìm kiếm", "Lưu trữ và tái sử dụng các điều kiện tìm kiếm cá nhân", true),
                new RolePermissionMatrixResponse.PermissionItem("user:read", "Xem danh sách người dùng", "Truy cập danh sách tài khoản", false),
                new RolePermissionMatrixResponse.PermissionItem("user:create", "Tạo tài khoản mới", "Khởi tạo tài khoản mới", false),
                new RolePermissionMatrixResponse.PermissionItem("user:update", "Cập nhật & gán quyền", "Chỉnh sửa thông tin và vai trò", false),
                new RolePermissionMatrixResponse.PermissionItem("user:toggle_status", "Khóa / Mở khóa tài khoản", "Khóa hoặc mở khóa tài khoản", false),
                new RolePermissionMatrixResponse.PermissionItem("role:manage", "Quản lý vai trò & quyền hạn", "Quản lý vai trò và phân quyền", false)
        );

        matrix.put(Role.ROLE_ADMIN.name(), adminPermissions);
        matrix.put(Role.ROLE_STAFF.name(), staffPermissions);

        return new RolePermissionMatrixResponse(matrix);
    }
}
