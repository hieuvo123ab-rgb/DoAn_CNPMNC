package com.edms.repository;

import com.edms.entity.InvestigationCase;
import com.edms.entity.InvestigationSeverity;
import com.edms.entity.InvestigationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestigationCaseRepository extends JpaRepository<InvestigationCase, Long>, JpaSpecificationExecutor<InvestigationCase> {

    Optional<InvestigationCase> findByCaseNumber(String caseNumber);

    boolean existsByCaseNumber(String caseNumber);

    List<InvestigationCase> findByAssignedTo(String assignedTo);

    List<InvestigationCase> findByCreatedBy(String createdBy);

    List<InvestigationCase> findByTargetDocumentId(Long targetDocumentId);

    @Query("SELECT COUNT(c) FROM InvestigationCase c WHERE c.status = :status")
    long countByStatus(InvestigationStatus status);

    @Query("SELECT COUNT(c) FROM InvestigationCase c WHERE c.severity = :severity")
    long countBySeverity(InvestigationSeverity severity);

    @Query("SELECT c FROM InvestigationCase c ORDER BY c.createdAt DESC")
    List<InvestigationCase> findAllOrderByCreatedAtDesc();
}
