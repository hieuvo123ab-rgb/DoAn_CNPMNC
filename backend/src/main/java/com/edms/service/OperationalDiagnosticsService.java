package com.edms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.cert.X509Certificate;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Phase 16: Operational Diagnostics Service.
 *
 * Provides safe, lightweight health checks for critical and non-critical subsystems:
 * - PostgreSQL Connectivity (real query ping, latency measurement, no credentials exposed)
 * - Document Storage Availability (read/write access probe without user file paths)
 * - Signing KeyStore & Certificate Status (serial, subject, validity without private key leakage)
 * - Tesseract OCR Availability (cached version execution with timeouts)
 * - Notification Subsystem Availability
 *
 * Implements strict separation between Liveness (JVM alive) and Readiness (critical dependencies operational).
 */
@Service
public class OperationalDiagnosticsService {

    private static final Logger log = LoggerFactory.getLogger(OperationalDiagnosticsService.class);

    private final DataSource dataSource;
    private final FileStorageService fileStorageService;
    private final KeyStoreService keyStoreService;
    private final Environment environment;
    private final boolean failureSimulationEnabled;

    private final Instant startTime = Instant.now();

    // Cache OCR status to avoid spawning processes on every request
    private volatile CachedOcrResult cachedOcrResult = null;
    private static final long OCR_CACHE_TTL_SECONDS = 30;

    private record CachedOcrResult(Instant timestamp, String status, String version) {
        boolean isExpired() {
            return Duration.between(timestamp, Instant.now()).getSeconds() > OCR_CACHE_TTL_SECONDS;
        }
    }

    public OperationalDiagnosticsService(DataSource dataSource,
                                         FileStorageService fileStorageService,
                                         KeyStoreService keyStoreService,
                                         Environment environment,
                                         @Value("${edms.testing.failure-simulation-enabled:false}") boolean failureSimulationEnabled) {
        this.dataSource = dataSource;
        this.fileStorageService = fileStorageService;
        this.keyStoreService = keyStoreService;
        this.environment = environment;
        this.failureSimulationEnabled = failureSimulationEnabled;
    }

    public boolean isFailureSimulationAllowed() {
        if (environment != null) {
            List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());
            if (activeProfiles.contains("prod") || activeProfiles.contains("production")) {
                return false;
            }
            if (activeProfiles.contains("operational-test")) {
                return true;
            }
        }
        return failureSimulationEnabled;
    }

    public String sanitizeSimulation(String simulatedFailure) {
        if (!isFailureSimulationAllowed()) {
            return null;
        }
        return simulatedFailure;
    }

    public long getUptimeSeconds() {
        return Duration.between(startTime, Instant.now()).getSeconds();
    }

    /**
     * Real database connectivity check using a lightweight query (SELECT 1).
     * Measures latency in milliseconds and does not expose connection strings or credentials.
     */
    public Map<String, Object> checkDatabaseHealth(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> dbHealth = new LinkedHashMap<>();
        if ("database".equalsIgnoreCase(simulatedFailure)) {
            dbHealth.put("status", "DOWN");
            dbHealth.put("database", "PostgreSQL");
            dbHealth.put("latencyMs", -1);
            dbHealth.put("message", "Simulated database connectivity failure");
            return dbHealth;
        }

        long start = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.setQueryTimeout(3);
            stmt.execute("SELECT 1");
            long latency = System.currentTimeMillis() - start;

            dbHealth.put("status", "UP");
            dbHealth.put("database", "PostgreSQL");
            dbHealth.put("latencyMs", latency);
        } catch (Exception e) {
            log.warn("Database health diagnostic check failed: {}", e.getMessage());
            dbHealth.put("status", "DOWN");
            dbHealth.put("database", "PostgreSQL");
            dbHealth.put("latencyMs", -1);
            dbHealth.put("message", "Database ping failed");
        }
        return dbHealth;
    }

    /**
     * Storage diagnostic verifying read and write operability via an ephemeral probe file.
     * Temporary probe file is created, verified, and immediately deleted.
     */
    public Map<String, Object> checkStorageHealth(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> storageHealth = new LinkedHashMap<>();
        if ("storage".equalsIgnoreCase(simulatedFailure)) {
            storageHealth.put("status", "DOWN");
            storageHealth.put("readable", false);
            storageHealth.put("writable", false);
            storageHealth.put("message", "Simulated document storage failure");
            return storageHealth;
        }

        String probeName = ".health_probe_" + UUID.randomUUID() + ".tmp";
        Path probePath = fileStorageService.getFilePath(probeName);

        boolean readable = false;
        boolean writable = false;

        try {
            // Test write
            Files.writeString(probePath, "probe-check");
            writable = true;

            // Test read
            if (Files.exists(probePath) && Files.isReadable(probePath)) {
                String content = Files.readString(probePath);
                if ("probe-check".equals(content)) {
                    readable = true;
                }
            }
        } catch (Exception e) {
            log.warn("Storage health probe failed: {}", e.getMessage());
        } finally {
            try {
                Files.deleteIfExists(probePath);
            } catch (Exception ignored) {
            }
        }

        boolean healthy = readable && writable;
        storageHealth.put("status", healthy ? "UP" : "DOWN");
        storageHealth.put("readable", readable);
        storageHealth.put("writable", writable);
        if (!healthy) {
            storageHealth.put("message", "Document storage read/write check failed");
        }
        return storageHealth;
    }

    /**
     * KeyStore and digital signing certificate diagnostic.
     * Evaluates certificate availability, serial, subject, and expiration status without exposing private keys.
     */
    public Map<String, Object> checkSigningHealth(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> signingHealth = new LinkedHashMap<>();
        if ("signing".equalsIgnoreCase(simulatedFailure) || "keystore".equalsIgnoreCase(simulatedFailure)) {
            signingHealth.put("status", "DOWN");
            signingHealth.put("keyStoreLoaded", false);
            signingHealth.put("keyPairPresent", false);
            signingHealth.put("message", "Simulated digital signing keystore failure");
            return signingHealth;
        }

        try {
            X509Certificate cert = keyStoreService.getSigningCertificate();
            boolean keyPairPresent = keyStoreService.getSigningKey() != null;
            if (cert == null) {
                signingHealth.put("status", "DOWN");
                signingHealth.put("keyStoreLoaded", false);
                signingHealth.put("keyPairPresent", false);
                signingHealth.put("message", "Signing certificate not found in KeyStore");
                return signingHealth;
            }

            Instant now = Instant.now();
            Instant notBefore = cert.getNotBefore().toInstant();
            Instant notAfter = cert.getNotAfter().toInstant();
            boolean validNow = !now.isBefore(notBefore) && !now.isAfter(notAfter);

            signingHealth.put("status", "UP");
            signingHealth.put("keyStoreLoaded", true);
            signingHealth.put("keyPairPresent", keyPairPresent);
            signingHealth.put("subject", cert.getSubjectX500Principal().getName());
            signingHealth.put("serial", cert.getSerialNumber().toString());
            signingHealth.put("certificateSerial", cert.getSerialNumber().toString());
            signingHealth.put("validFrom", notBefore.toString());
            signingHealth.put("validUntil", notAfter.toString());
            signingHealth.put("notBefore", notBefore.toString());
            signingHealth.put("notAfter", notAfter.toString());
            signingHealth.put("validNow", validNow);
            signingHealth.put("signatureAlgorithm", cert.getSigAlgName());

            String expirationStatus;
            if (now.isBefore(notBefore)) {
                expirationStatus = "NOT_YET_VALID";
            } else if (now.isAfter(notAfter)) {
                expirationStatus = "EXPIRED";
            } else if (now.plus(30, ChronoUnit.DAYS).isAfter(notAfter)) {
                expirationStatus = "EXPIRING_SOON";
            } else {
                expirationStatus = "VALID";
            }
            signingHealth.put("expirationStatus", expirationStatus);

        } catch (Exception e) {
            log.warn("KeyStore diagnostic check failed: {}", e.getMessage());
            signingHealth.put("status", "DOWN");
            signingHealth.put("keyStoreLoaded", false);
            signingHealth.put("keyPairPresent", false);
            signingHealth.put("message", "KeyStore check failed");
        }
        return signingHealth;
    }

    /**
     * Non-critical OCR diagnostic checking Tesseract binary safely.
     * Result is cached for 30 seconds to prevent unnecessary process spawning.
     */
    public Map<String, Object> checkOcrHealth(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> ocrHealth = new LinkedHashMap<>();
        if ("ocr".equalsIgnoreCase(simulatedFailure)) {
            ocrHealth.put("status", "UNAVAILABLE");
            ocrHealth.put("engine", "Tesseract OCR");
            ocrHealth.put("message", "Simulated OCR engine unavailable");
            return ocrHealth;
        }

        CachedOcrResult cached = cachedOcrResult;
        if (cached != null && !cached.isExpired()) {
            ocrHealth.put("status", cached.status());
            ocrHealth.put("engine", "Tesseract OCR");
            if (cached.version() != null) {
                ocrHealth.put("version", cached.version());
            }
            return ocrHealth;
        }

        String status = "UNAVAILABLE";
        String versionStr = null;

        try {
            ProcessBuilder pb = new ProcessBuilder("tesseract", "--version");
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            boolean finished = proc.waitFor(2, TimeUnit.SECONDS);

            if (finished && proc.exitValue() == 0) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                    String firstLine = reader.readLine();
                    if (firstLine != null && !firstLine.isBlank()) {
                        status = "AVAILABLE";
                        versionStr = firstLine.trim();
                    }
                }
            } else {
                proc.destroyForcibly();
            }
        } catch (Exception e) {
            log.debug("Tesseract CLI not available: {}", e.getMessage());
        }

        cachedOcrResult = new CachedOcrResult(Instant.now(), status, versionStr);
        ocrHealth.put("status", status);
        ocrHealth.put("engine", "Tesseract OCR");
        if (versionStr != null) {
            ocrHealth.put("version", versionStr);
        }
        return ocrHealth;
    }

    /**
     * Lightweight check for notification path availability.
     */
    public Map<String, Object> checkNotificationsHealth(Map<String, Object> dbHealth) {
        Map<String, Object> notifHealth = new LinkedHashMap<>();
        boolean dbUp = "UP".equals(dbHealth.get("status"));
        notifHealth.put("status", dbUp ? "UP" : "DOWN");
        return notifHealth;
    }

    /**
     * Evaluates comprehensive system status across all components.
     */
    public Map<String, Object> getSystemStatus(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> dbHealth = checkDatabaseHealth(simulatedFailure);
        Map<String, Object> storageHealth = checkStorageHealth(simulatedFailure);
        Map<String, Object> signingHealth = checkSigningHealth(simulatedFailure);
        Map<String, Object> ocrHealth = checkOcrHealth(simulatedFailure);
        Map<String, Object> notifHealth = checkNotificationsHealth(dbHealth);

        boolean dbUp = "UP".equals(dbHealth.get("status"));
        boolean storageUp = "UP".equals(storageHealth.get("status"));
        boolean signingUp = "UP".equals(signingHealth.get("status"));
        boolean ocrAvailable = "AVAILABLE".equals(ocrHealth.get("status"));

        String readiness;
        String overallStatus;

        if (!dbUp || !storageUp || !signingUp) {
            readiness = "NOT_READY";
            overallStatus = "DOWN";
        } else if (!ocrAvailable) {
            readiness = "DEGRADED";
            overallStatus = "UP";
        } else {
            readiness = "READY";
            overallStatus = "UP";
        }

        Map<String, Object> components = new LinkedHashMap<>();
        components.put("database", dbHealth);
        components.put("storage", storageHealth);
        components.put("signing", signingHealth);
        components.put("signingKeyStore", signingHealth);
        components.put("ocr", ocrHealth);
        components.put("notifications", notifHealth);

        Map<String, Object> systemInfo = new LinkedHashMap<>();
        systemInfo.put("javaVersion", System.getProperty("java.version"));
        systemInfo.put("osName", System.getProperty("os.name"));
        systemInfo.put("availableProcessors", Runtime.getRuntime().availableProcessors());

        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> runtimeMetrics = new LinkedHashMap<>();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;
        runtimeMetrics.put("heapUsedMb", usedMemory / (1024 * 1024));
        runtimeMetrics.put("heapTotalMb", totalMemory / (1024 * 1024));
        runtimeMetrics.put("heapMaxMb", maxMemory / (1024 * 1024));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", overallStatus);
        result.put("readiness", readiness);
        result.put("uptimeSeconds", getUptimeSeconds());
        result.put("timestamp", Instant.now().toString());
        result.put("components", components);
        result.put("system", systemInfo);
        result.put("runtimeMetrics", runtimeMetrics);

        return result;
    }

    /**
     * Evaluates readiness signal for readiness probes.
     */
    public Map<String, Object> getReadiness(String simulatedFailure) {
        simulatedFailure = sanitizeSimulation(simulatedFailure);
        Map<String, Object> status = getSystemStatus(simulatedFailure);
        Map<String, Object> readinessResult = new LinkedHashMap<>();
        readinessResult.put("status", status.get("status"));
        readinessResult.put("readiness", status.get("readiness"));
        readinessResult.put("uptimeSeconds", status.get("uptimeSeconds"));
        readinessResult.put("timestamp", status.get("timestamp"));
        return readinessResult;
    }
}
