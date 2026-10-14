package com.edms.repository;

import com.edms.entity.DispositionStatus;
import com.edms.entity.DocumentDisposition;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentDispositionRepository extends JpaRepository<DocumentDisposition, Long>, JpaSpecificationExecutor<DocumentDisposition> {

    List<DocumentDisposition> findByDocumentIdOrderByRequestedAtDesc(Long documentId);

    List<DocumentDisposition> findByStatusOrderByRequestedAtAsc(DispositionStatus status);

    List<DocumentDisposition> findAllByOrderByRequestedAtAsc();

    long countByDocumentIdAndStatus(Long documentId, DispositionStatus status);

    long countByStatus(DispositionStatus status);

    Optional<DocumentDisposition> findFirstByDocumentIdAndStatus(Long documentId, DispositionStatus status);

    List<DocumentDisposition> findByDocumentIdAndStatus(Long documentId, DispositionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DocumentDisposition d WHERE d.id = :id")
    Optional<DocumentDisposition> findByIdForUpdate(@Param("id") Long id);
}
