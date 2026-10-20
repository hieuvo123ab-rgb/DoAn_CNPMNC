package com.edms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${edms.jwt.secret}") String secret,
            @Value("${edms.jwt.expiration-ms:86400000}") long expirationMs,
            org.springframework.core.env.Environment environment) {
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalArgumentException("EDMS JWT secret key must be at least 256 bits (32 characters) for HMAC-SHA algorithms.");
        }
        if (environment != null) {
            java.util.List<String> activeProfiles = java.util.Arrays.asList(environment.getActiveProfiles());
            if ((activeProfiles.contains("prod") || activeProfiles.contains("production"))
                    && "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970".equals(secret)) {
                throw new IllegalStateException("Production environment MUST configure a secure, unique EDMS_JWT_SECRET instead of the default development placeholder.");
            }
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
