package com.edms.repository;

import com.edms.entity.ManualTaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManualTaskActivityRepository extends JpaRepository<ManualTaskActivity, Long> {

    List<ManualTaskActivity> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    void deleteByTaskId(Long taskId);
}
