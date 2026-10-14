package com.edms.security;

import com.edms.service.SystemMetricsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Phase 16: Request Correlation ID Filter.
 *
 * Ensures every incoming HTTP request is assigned a unique correlation ID.
 * If the client supplies a valid X-Correlation-ID header, it is reused.
 * Otherwise, a secure UUID v4 is generated.
 * The correlation ID is exposed in the HTTP response header and placed in the
 * SLF4J MDC logging context for structured traceability across all backend logs.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String MDC_KEY = "correlationId";
    public static final String REQUEST_ATTR_KEY = "correlationId";

    // Strict validation: alphanumeric plus '.', '_', '-' up to 128 characters
    private static final Pattern VALID_CORRELATION_ID_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{1,128}$");

    private final SystemMetricsService systemMetricsService;

    public CorrelationIdFilter(SystemMetricsService systemMetricsService) {
        this.systemMetricsService = systemMetricsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);

        if (correlationId == null || correlationId.trim().isEmpty() || !VALID_CORRELATION_ID_PATTERN.matcher(correlationId.trim()).matches()) {
            correlationId = UUID.randomUUID().toString();
        } else {
            correlationId = correlationId.trim();
        }

        // Store in MDC context for logging and request attribute for error handlers
        MDC.put(MDC_KEY, correlationId);
        request.setAttribute(REQUEST_ATTR_KEY, correlationId);

        // Echo back in the response header
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        log.info("Incoming HTTP {} {}", request.getMethod(), request.getRequestURI());

        long startTime = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            systemMetricsService.recordRequest(duration);
            MDC.remove(MDC_KEY);
        }
    }
}
