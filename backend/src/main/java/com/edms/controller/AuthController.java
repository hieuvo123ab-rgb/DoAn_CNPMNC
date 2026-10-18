package com.edms.controller;

import com.edms.dto.LoginRequest;
import com.edms.dto.LoginResponse;
import com.edms.service.AuthService;
import com.edms.service.OperationalDiagnosticsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final com.edms.security.LoginRateLimiterService loginRateLimiterService;
    private final OperationalDiagnosticsService diagnosticsService;

    public AuthController(AuthService authService,
                          com.edms.security.LoginRateLimiterService loginRateLimiterService,
                          OperationalDiagnosticsService diagnosticsService) {
        this.authService = authService;
        this.loginRateLimiterService = loginRateLimiterService;
        this.diagnosticsService = diagnosticsService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Test-Lockout-Seconds", required = false) Long testLockoutSeconds,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        if (testLockoutSeconds != null && testLockoutSeconds > 0 && diagnosticsService.isFailureSimulationAllowed()) {
            loginRateLimiterService.setLockoutSeconds(testLockoutSeconds);
        }

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        LoginResponse response = authService.login(request, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-rate-limit")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> resetRateLimit(
            @RequestBody(required = false) Map<String, String> request) {
        if (request != null && request.containsKey("username")) {
            String username = request.get("username");
            if (username == null || username.isBlank()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "username must not be blank"));
            }

            int cleared = loginRateLimiterService.clearUser(username);
            return ResponseEntity.ok(Map.of(
                    "message", "Rate limit cleared for the selected user",
                    "clearedEntries", Integer.toString(cleared)));
        }

        // Backward-compatible global administrative reset (no request body).
        loginRateLimiterService.resetDefaults();
        loginRateLimiterService.clearAll();
        return ResponseEntity.ok(Map.of("message", "Rate limit state reset successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(java.security.Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        authService.logout(username);
        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}
