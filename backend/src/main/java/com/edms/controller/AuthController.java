package com.edms.controller;

import com.edms.dto.LoginRequest;
import com.edms.dto.LoginResponse;
import com.edms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

    public AuthController(AuthService authService, com.edms.security.LoginRateLimiterService loginRateLimiterService) {
        this.authService = authService;
        this.loginRateLimiterService = loginRateLimiterService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Test-Lockout-Seconds", required = false) Long testLockoutSeconds,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        if (testLockoutSeconds != null && testLockoutSeconds > 0) {
            loginRateLimiterService.setLockoutSeconds(testLockoutSeconds);
        }

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        LoginResponse response = authService.login(request, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-rate-limit")
    public ResponseEntity<Map<String, String>> resetRateLimit() {
        loginRateLimiterService.resetDefaults();
        loginRateLimiterService.clearAll();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Rate limit state reset successfully");
        return ResponseEntity.ok(response);
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
