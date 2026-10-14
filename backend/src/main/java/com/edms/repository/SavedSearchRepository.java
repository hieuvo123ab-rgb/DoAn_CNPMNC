package com.edms.repository;

import com.edms.entity.SavedSearch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedSearchRepository extends JpaRepository<SavedSearch, Long> {

    List<SavedSearch> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    Optional<SavedSearch> findByIdAndCreatedBy(Long id, String createdBy);
}
