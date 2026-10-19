package com.edms.config;

import com.edms.security.CustomUserDetailsService;
import com.edms.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final String[] allowedOrigins;

    public WebSocketConfig(JwtTokenProvider jwtTokenProvider,
                           CustomUserDetailsService userDetailsService,
                           @Value("${EDMS_WEBSOCKET_ALLOWED_ORIGINS:http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080}") String configuredOrigins) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        if (!StringUtils.hasText(configuredOrigins)) {
            throw new IllegalArgumentException("EDMS WebSocket allowed origins must not be empty");
        }
        this.allowedOrigins = configuredOrigins.trim().split("\\s*,\\s*");
        for (String origin : allowedOrigins) {
            if (!StringUtils.hasText(origin) || "*".equals(origin)) {
                throw new IllegalArgumentException("WebSocket allowed origins must be explicit, not wildcard");
            }
        }
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory simple broker for topic broadcasts and user private queues
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for application-handled messages (@MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for user-targeted messages (convertAndSendToUser)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS fallback endpoint (WebSocket -> xhr-streaming -> xhr-polling)
        registry.addEndpoint("/ws-edms")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();

        // Direct native WebSocket endpoint
        registry.addEndpoint("/ws-edms")
                .setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                // 1. Authenticate on STOMP CONNECT frame
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String jwt = extractJwt(accessor);
                    if (!StringUtils.hasText(jwt) || !jwtTokenProvider.validateToken(jwt)) {
                        log.warn("[WebSocket] STOMP CONNECT rejected: missing or invalid JWT");
                        throw new BadCredentialsException("Invalid or expired JWT token for STOMP connection");
                    }

                    String username = jwtTokenProvider.getUsernameFromToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (!userDetails.isEnabled()) {
                        log.warn("[WebSocket] STOMP CONNECT rejected: user account {} is disabled", username);
                        throw new AccessDeniedException("User account is disabled");
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(authentication);
                    log.info("[WebSocket] STOMP CONNECT authenticated for user: {}", username);
                }

                // Broker destinations are server-published only. Never let a client
                // impersonate a notification by sending to /topic or /queue.
                else if (StompCommand.SEND.equals(accessor.getCommand())) {
                    throw new AccessDeniedException("Client STOMP SEND is disabled for notification channels");
                }

                // Restrict subscription paths to the only two destinations
                // actually used by the application.
                else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    authorizeSubscription(accessor.getDestination(), accessor.getUser());
                }

                return message;
            }
        });
    }

    static void authorizeSubscription(String destination, Principal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Unauthenticated STOMP subscription rejected");
        }
        if ("/user/queue/notifications".equals(destination)) {
            return;
        }
        if ("/topic/admin/notifications".equals(destination)) {
            if (principal instanceof Authentication authentication
                    && authentication.getAuthorities().stream()
                            .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()))) {
                return;
            }
            throw new AccessDeniedException("Administrator privileges required for this destination");
        }
        throw new AccessDeniedException("STOMP subscription destination is not allowed");
    }

    private String extractJwt(StompHeaderAccessor accessor) {
        // Priority 1: "Authorization: Bearer <token>"
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
                return header.substring(7).trim();
            }
            if (StringUtils.hasText(header)) {
                return header.trim();
            }
        }

        // Priority 2: "token" header
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            String token = tokenHeaders.get(0);
            if (StringUtils.hasText(token)) {
                return token.trim();
            }
        }

        // Priority 3: Passcode header
        String passcode = accessor.getPasscode();
        if (StringUtils.hasText(passcode)) {
            return passcode.trim();
        }

        return null;
    }
}
