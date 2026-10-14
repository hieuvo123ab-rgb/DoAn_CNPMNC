package com.edms.repository;

import com.edms.entity.DocumentReview;
import com.edms.entity.ReviewStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentReviewRepository extends JpaRepository<DocumentReview, Long>, JpaSpecificationExecutor<DocumentReview> {

    List<DocumentReview> findByDocumentIdOrderBySubmittedAtDesc(Long documentId);

    List<DocumentReview> findByDocumentIdAndVersionNumberOrderBySubmittedAtDesc(Long documentId, Integer versionNumber);

    List<DocumentReview> findByDocumentIdAndVersionNumberAndStatus(Long documentId, Integer versionNumber, ReviewStatus status);

    List<DocumentReview> findByDocumentIdAndStatus(Long documentId, ReviewStatus status);

    List<DocumentReview> findByStatusOrderBySubmittedAtAsc(ReviewStatus status);

    List<DocumentReview> findAllByOrderBySubmittedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM DocumentReview r WHERE r.id = :id")
    Optional<DocumentReview> findByIdForUpdate(@Param("id") Long id);

    long countByStatus(ReviewStatus status);
}
