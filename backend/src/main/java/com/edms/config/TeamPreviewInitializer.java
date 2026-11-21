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

import java.util.List;
import java.util.Set;

/**
 * Creates disposable accounts in the isolated Team Preview database.
 * Existing preview account passwords are synchronized on every startup, so
 * rotating EDMS_PREVIEW_SHARED_PASSWORD does not require deleting data.
 * NEVER enable this profile against a real user database.
 */
@Configuration
@Profile("team-preview")
public class TeamPreviewInitializer {

    private static final Set<String> PREVIEW_USERNAMES =
            Set.of("preview_admin", "preview_staff", "preview_user");

    @Bean
    CommandLineRunner initializePreviewAccounts(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${EDMS_TEAM_PREVIEW_ENABLED:false}") boolean previewEnabled,
            @Value("${EDMS_PREVIEW_SHARED_PASSWORD:}") String sharedPassword) {
        return args -> {
            if (!previewEnabled) {
                throw new IllegalStateException("Team preview requires EDMS_TEAM_PREVIEW_ENABLED=true");
            }
            if (sharedPassword.length() < 16) {
                throw new IllegalStateException("Preview shared password must be at least 16 characters");
            }

            List<User> existing = users.findAll();
            for (User user : existing) {
                if (!PREVIEW_USERNAMES.contains(user.getUsername())) {
                    throw new IllegalStateException(
                            "Refusing to initialize Team Preview against a database containing real users");
                }
            }

            ensurePreviewUser(users, encoder, existing, "preview_admin",
                    "EDMS Preview Administrator", Role.ROLE_ADMIN, sharedPassword);
            ensurePreviewUser(users, encoder, existing, "preview_staff",
                    "EDMS Preview Team Member", Role.ROLE_STAFF, sharedPassword);
            ensurePreviewUser(users, encoder, existing, "preview_user",
                    "EDMS Preview User", Role.ROLE_USER, sharedPassword);
        };
    }

    private static void ensurePreviewUser(UserRepository users, PasswordEncoder encoder,
                                          List<User> existing, String username,
                                          String displayName, Role role, String password) {
        User found = existing.stream().filter(u -> username.equals(u.getUsername()))
                .findFirst().orElse(null);
        if (found == null) {
            users.save(new User(username, encoder.encode(password), displayName,
                    username + "@example.invalid", role));
            return;
        }
        if (found.getRole() != role) {
            throw new IllegalStateException("Unexpected role for Team Preview account " + username);
        }
        if (!encoder.matches(password, found.getPassword())) {
            found.setPassword(encoder.encode(password));
            users.save(found);
        }
    }
}
