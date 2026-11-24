package com.edms.service;

import com.edms.dto.LoginRequest;
import com.edms.dto.LoginResponse;
import com.edms.dto.RegisterRequest;
import com.edms.entity.User;
import com.edms.entity.Role;
import com.edms.exception.LoginRateLimitedException;
import com.edms.exception.UserAlreadyExistsException;
import com.edms.repository.UserRepository;
import com.edms.security.JwtTokenProvider;
import com.edms.security.LoginRateLimiterService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final LoginRateLimiterService loginRateLimiterService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       UserRepository userRepository,
                       AuditService auditService,
                       LoginRateLimiterService loginRateLimiterService,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.loginRateLimiterService = loginRateLimiterService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Tên đăng nhập '" + username + "' đã được sử dụng.");
        }

        User user = new User(username, passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null,
                Role.ROLE_USER);
        User savedUser = userRepository.save(user);
        auditService.log(savedUser.getUsername(), "USER_REGISTER", "AUTH", savedUser.getUsername(),
                "Đăng ký tài khoản người dùng", null);
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
