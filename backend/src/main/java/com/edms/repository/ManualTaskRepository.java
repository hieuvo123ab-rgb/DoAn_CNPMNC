package com.edms.repository;

import com.edms.entity.ManualTask;
import com.edms.entity.ManualTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ManualTaskRepository extends JpaRepository<ManualTask, Long>, JpaSpecificationExecutor<ManualTask> {

    List<ManualTask> findByAssigneeOrderByCreatedAtDesc(String assignee);

    List<ManualTask> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    long countByStatus(ManualTaskStatus status);

    @Query("SELECT COUNT(t) FROM ManualTask t WHERE t.status NOT IN ('DONE', 'CANCELLED') AND t.dueDate IS NOT NULL AND t.dueDate < :now")
    long countOverdueTasks(@Param("now") Instant now);

    @Query("SELECT COUNT(t) FROM ManualTask t WHERE (t.assignee = :username OR t.createdBy = :username) AND t.status NOT IN ('DONE', 'CANCELLED') AND t.dueDate IS NOT NULL AND t.dueDate < :now")
    long countOverdueTasksForUser(@Param("username") String username, @Param("now") Instant now);

    long countByAssigneeOrCreatedBy(String assignee, String createdBy);

    long countByStatusAndAssignee(ManualTaskStatus status, String assignee);
}
