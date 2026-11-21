package com.edms.repository;

import com.edms.entity.InvestigationFinding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationFindingRepository extends JpaRepository<InvestigationFinding, Long> {

    List<InvestigationFinding> findByCaseIdOrderByCreatedAtAsc(Long caseId);

    long countByCaseId(Long caseId);
}
