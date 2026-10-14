package com.edms.controller;

import com.edms.dto.TaskDto;
import com.edms.service.TaskCenterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskCenterService taskCenterService;

    public TaskController(TaskCenterService taskCenterService) {
        this.taskCenterService = taskCenterService;
    }

    /**
     * Retrieves actionable tasks derived from authoritative workflow states.
     */
    @GetMapping
    public ResponseEntity<List<TaskDto>> getTasks(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));

        List<TaskDto> tasks = taskCenterService.getUserTasks(authentication.getName(), isAdmin);
        return ResponseEntity.ok(tasks);
    }
}
