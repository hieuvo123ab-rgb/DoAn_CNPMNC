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

/**
 * First-run bootstrap ONLY for the isolated Docker Team Server.
 * Does not modify an existing user database or reset passwords on restart.
 * Unlike team-preview, individual Staff/User accounts can be managed through the admin UI.
 */
@Configuration
@Profile("team-server")
public class TeamServerInitializer {

    @Bean
    CommandLineRunner bootstrapTeamAdmin(
            UserRepository users,
            PasswordEncoder encoder,
            @Value("${EDMS_TEAM_SERVER_ENABLED:false}") boolean teamServerEnabled,
            @Value("${EDMS_TEAM_ADMIN_USERNAME:team_admin}") String adminUsername,
            @Value("${EDMS_TEAM_ADMIN_PASSWORD:}") String adminPassword) {
        return args -> {
            if (!teamServerEnabled) {
                throw new IllegalStateException("Team Server bootstrap requires EDMS_TEAM_SERVER_ENABLED=true");
            }
            if (!adminUsername.matches("[A-Za-z0-9._-]{3,50}")) {
                throw new IllegalStateException("EDMS_TEAM_ADMIN_USERNAME is invalid");
            }
            List<User> existing = users.findAll();
            if (!existing.isEmpty()) {
                // Do not grant admin privileges on an existing unknown database.
                boolean hasBootstrapAdmin = existing.stream().anyMatch(user ->
                        adminUsername.equals(user.getUsername()) && user.getRole() == Role.ROLE_ADMIN);
                if (!hasBootstrapAdmin) {
                    throw new IllegalStateException(
                            "Refusing Team Server bootstrap: database already has users but no expected Admin. " +
                            "Do not delete data; recover the intended Admin account safely.");
                }
                return;
            }
            if (adminPassword.length() < 16) {
                throw new IllegalStateException("EDMS_TEAM_ADMIN_PASSWORD must have at least 16 characters");
            }
            users.save(new User(
                    adminUsername,
                    encoder.encode(adminPassword),
                    "Quản trị EDMS",
                    adminUsername + "@example.invalid",
                    Role.ROLE_ADMIN));
        };
    }
}
