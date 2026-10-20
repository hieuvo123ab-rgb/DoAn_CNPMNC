package com.edms.config;

import com.edms.entity.Role;
import com.edms.entity.User;
import com.edms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Explicitly gated, first-run accounts for a NEW, disposable preview database.
 * No passwords are embedded in source control or written to logs.
 */
@Configuration
@Profile("team-preview")
public class TeamPreviewInitializer {

    @Bean
    CommandLineRunner initializePreviewAccounts(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${EDMS_TEAM_PREVIEW_ENABLED:false}") boolean previewEnabled,
            @Value("${EDMS_PREVIEW_ADMIN_PASSWORD:}") String adminPassword,
            @Value("${EDMS_PREVIEW_STAFF_PASSWORD:}") String staffPassword) {
        return args -> {
            if (!previewEnabled) {
                throw new IllegalStateException("Team preview profile requires explicit EDMS_TEAM_PREVIEW_ENABLED=true");
            }

            if (users.count() > 0) {
                // Fail closed rather than seed or silently expose a pre-existing database.
                if (!users.existsByUsername("preview_admin") || !users.existsByUsername("preview_staff")) {
                    throw new IllegalStateException(
                            "Team preview refuses to start against a database with non-preview accounts");
                }
                return;
            }

            if (adminPassword.length() < 16 || staffPassword.length() < 16) {
                throw new IllegalStateException("Team preview passwords must each be at least 16 characters");
            }
            users.save(new User(
                    "preview_admin", encoder.encode(adminPassword),
                    "EDMS Preview Administrator", "preview-admin@example.invalid", Role.ROLE_ADMIN));
            users.save(new User(
                    "preview_staff", encoder.encode(staffPassword),
                    "EDMS Preview Team Member", "preview-staff@example.invalid", Role.ROLE_STAFF));
        };
    }
}
