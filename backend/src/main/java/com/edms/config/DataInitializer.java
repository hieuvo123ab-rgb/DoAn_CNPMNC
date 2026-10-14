package com.edms.config;

import com.edms.entity.Role;
import com.edms.entity.User;
import com.edms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed user 'hieu' (Võ Trọng Hiếu - Team Lead)
            if (!userRepository.existsByUsername("hieu")) {
                User hieu = new User(
                        "hieu",
                        passwordEncoder.encode("password123"),
                        "Võ Trọng Hiếu",
                        "hieu@edms.local",
                        Role.ROLE_ADMIN
                );
                userRepository.save(hieu);
            }

            // Seed user 'tin' (Tạ Gia Tín - Developer)
            if (!userRepository.existsByUsername("tin")) {
                User tin = new User(
                        "tin",
                        passwordEncoder.encode("password123"),
                        "Tạ Gia Tín",
                        "tin@edms.local",
                        Role.ROLE_STAFF
                );
                userRepository.save(tin);
            }
        };
    }
}
