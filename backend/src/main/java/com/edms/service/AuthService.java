package com.edms.service;

import com.edms.dto.LoginRequest;
import com.edms.dto.LoginResponse;
import com.edms.entity.User;
import com.edms.exception.LoginRateLimitedException;
import com.edms.repository.UserRepository;
import com.edms.security.JwtTokenProvider;
import com.edms.security.LoginRateLimiterService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final LoginRateLimiterService loginRateLimiterService;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       UserRepository userRepository,
                       AuditService auditService,
                       LoginRateLimiterService loginRateLimiterService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.loginRateLimiterService = loginRateLimiterService;
    }

    public LoginResponse login(LoginRequest request) {
        return login(request, "127.0.0.1");
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";

        // Phase 17: Check rate limiting threshold before authentication
        if (loginRateLimiterService.isBlocked(username, clientIp)) {
            long retryAfter = loginRateLimiterService.getRemainingLockoutSeconds(username, clientIp);
            auditService.log(username, "LOGIN_RATE_LIMITED", "AUTH", username,
                    "Từ chối đăng nhập do vượt ngưỡng tần suất (HTTP 429)", null);
            throw new LoginRateLimitedException("Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau.", retryAfter);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(authentication);

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            // Successful authentication clears failed attempt state
            loginRateLimiterService.recordSuccess(username, clientIp);

            auditService.log(user.getUsername(), "LOGIN_SUCCESS", "AUTH", user.getUsername(), "Đăng nhập thành công", null);
            return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name());
        } catch (Exception e) {
            // Record failure to composite (username + clientIp) limiter
            loginRateLimiterService.recordFailure(username, clientIp);
            auditService.log(username, "LOGIN_FAILED", "AUTH", username, "Đăng nhập thất bại", null);
            throw e;
        }
    }

    public void logout(String username) {
        auditService.log(username, "LOGOUT", "AUTH", username, "Đăng xuất tài khoản", null);
    }
}
