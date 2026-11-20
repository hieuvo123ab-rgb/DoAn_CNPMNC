package com.edms.repository;

import com.edms.entity.DataRoom;
import com.edms.entity.DataRoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataRoomRepository extends JpaRepository<DataRoom, Long>, JpaSpecificationExecutor<DataRoom> {

    Optional<DataRoom> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<DataRoom> findByOwnerUsername(String ownerUsername);

    List<DataRoom> findByStatus(DataRoomStatus status);

    long countByStatus(DataRoomStatus status);

    @Query("SELECT r FROM DataRoom r ORDER BY r.createdAt DESC")
    List<DataRoom> findAllOrderByCreatedAtDesc();
}
