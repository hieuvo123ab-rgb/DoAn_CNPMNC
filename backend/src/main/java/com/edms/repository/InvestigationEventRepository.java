package com.edms.repository;

import com.edms.entity.InvestigationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationEventRepository extends JpaRepository<InvestigationEvent, Long> {

    List<InvestigationEvent> findByCaseIdOrderByTimestampDesc(Long caseId);

    List<InvestigationEvent> findByCaseIdOrderByTimestampAsc(Long caseId);

    long countByCaseId(Long caseId);
}
