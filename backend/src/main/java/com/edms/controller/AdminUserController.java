package com.edms.controller;

import com.edms.dto.CreateUserRequest;
import com.edms.dto.RolePermissionMatrixResponse;
import com.edms.dto.UpdateUserRequest;
import com.edms.dto.UserResponse;
import com.edms.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = adminUserService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") Long id) {
        UserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = adminUserService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    @RequestMapping(value = "/users/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<UserResponse> setUserStatus(
            @PathVariable("id") Long id,
            @RequestParam("enabled") boolean enabled) {
        UserResponse user = adminUserService.setUserStatus(id, enabled);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/roles/permissions")
    public ResponseEntity<RolePermissionMatrixResponse> getRolePermissions() {
        RolePermissionMatrixResponse matrix = adminUserService.getRolePermissionsMatrix();
        return ResponseEntity.ok(matrix);
    }
}
