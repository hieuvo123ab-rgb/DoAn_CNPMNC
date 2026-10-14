package com.edms.service;

import com.edms.entity.AuditLog;
import com.edms.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Record an audit log event safely.
     * Uses REQUIRES_NEW propagation so audit logs persist even if caller transaction rolls back,
     * and catches exceptions so audit failures never break primary business logic.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, String action, String resourceType, String resourceId, String description, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog(username, action, resourceType, resourceId, description, ipAddress);
            auditLogRepository.save(auditLog);
            logger.info("Audit log recorded: [user={}, action={}, resource={}]", username, action, resourceType);
        } catch (Exception e) {
            logger.warn("Failed to record audit log: [user={}, action={}, error={}]", username, action, e.getMessage());
        }
    }

    public List<AuditLog> getRecentActivities(int limit) {
        Pageable pageable = PageRequest.of(0, Math.max(1, limit));
        return auditLogRepository.findRecentActivities(pageable);
    }

    public Page<AuditLog> getAuditLogs(String username, String action, String resourceType, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (username != null && !username.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("username")), "%" + username.trim().toLowerCase() + "%"));
            }
            if (action != null && !action.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }
            if (resourceType != null && !resourceType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType.trim()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable);
    }

    public long countByAction(String action) {
        return auditLogRepository.countByAction(action);
    }

    public long countDistinctActiveUsers() {
        return auditLogRepository.countDistinctUsernames();
    }
}
