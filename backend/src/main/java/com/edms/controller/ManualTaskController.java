package com.edms.controller;

import com.edms.dto.*;
import com.edms.service.ManualTaskService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manual-tasks")
public class ManualTaskController {

    private final ManualTaskService manualTaskService;

    public ManualTaskController(ManualTaskService manualTaskService) {
        this.manualTaskService = manualTaskService;
    }

    @GetMapping
    public ResponseEntity<Page<ManualTaskResponse>> getTasks(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "assignee", required = false) String assignee,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "overdue", required = false) Boolean overdue,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDirection", defaultValue = "desc") String sortDirection,
            Authentication authentication) {

        boolean isAdmin = isAdmin(authentication);
        Page<ManualTaskResponse> tasks = manualTaskService.getTasks(
                authentication.getName(), isAdmin, status, priority, assignee, search, overdue, page, size, sortBy, sortDirection
        );
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/summary")
    public ResponseEntity<ManualTaskSummaryDto> getSummary(Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        ManualTaskSummaryDto summary = manualTaskService.getSummary(authentication.getName(), isAdmin);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/assignees")
    public ResponseEntity<List<AssigneeOptionDto>> getAssignees() {
        List<AssigneeOptionDto> assignees = manualTaskService.getAssigneeOptions();
        return ResponseEntity.ok(assignees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManualTaskResponse> getTaskById(
            @PathVariable("id") Long id,
            Authentication authentication) {
        boolean isAdmin = isAdmin(authentication);
        ManualTaskResponse task = manualTaskService.getTaskById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<ManualTaskResponse> createTask(
            @Valid @RequestBody ManualTaskCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();
        ManualTaskResponse task = manualTaskService.createTask(request, authentication.getName(), isAdmin, ipAddress);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ManualTaskResponse> updateTask(
            @PathVariable("id") Long id,
            @Valid @RequestBody ManualTaskUpdateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();
        ManualTaskResponse task = manualTaskService.updateTask(id, request, authentication.getName(), isAdmin, ipAddress);
        return ResponseEntity.ok(task);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ManualTaskResponse> updateStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody ManualTaskStatusUpdateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();
        ManualTaskResponse task = manualTaskService.updateStatus(id, request, authentication.getName(), isAdmin, ipAddress);
        return ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable("id") Long id,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        boolean isAdmin = isAdmin(authentication);
        String ipAddress = servletRequest.getRemoteAddr();
        manualTaskService.deleteTask(id, authentication.getName(), isAdmin, ipAddress);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
