package com.edms.repository;

import com.edms.entity.Role;
import com.edms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    long countByRoleAndEnabledTrue(Role role);
    List<User> findByRoleAndEnabledTrue(Role role);
    List<User> findAllByOrderByCreatedAtDesc();
}

