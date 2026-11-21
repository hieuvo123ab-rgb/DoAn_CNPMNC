package com.edms.repository;

import com.edms.entity.InvestigationEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestigationEvidenceRepository extends JpaRepository<InvestigationEvidence, Long> {

    List<InvestigationEvidence> findByCaseIdOrderByCollectedAtAsc(Long caseId);

    List<InvestigationEvidence> findByCaseIdOrderByCollectedAtDesc(Long caseId);

    long countByCaseId(Long caseId);

    Optional<InvestigationEvidence> findByCaseIdAndDocumentIdAndVersionNumber(Long caseId, Long documentId, Integer versionNumber);

    boolean existsByCaseIdAndDocumentIdAndVersionNumber(Long caseId, Long documentId, Integer versionNumber);

    List<InvestigationEvidence> findByDocumentId(Long documentId);
}
