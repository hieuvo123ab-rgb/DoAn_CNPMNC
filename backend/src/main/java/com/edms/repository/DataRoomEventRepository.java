package com.edms.repository;

import com.edms.entity.DataRoomEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataRoomEventRepository extends JpaRepository<DataRoomEvent, Long> {

    List<DataRoomEvent> findByRoomIdOrderByTimestampDesc(Long roomId);

    List<DataRoomEvent> findByRoomIdAndSuspiciousTrueOrderByTimestampDesc(Long roomId);

    List<DataRoomEvent> findBySuspiciousTrueOrderByTimestampDesc();

    long countBySuspiciousTrue();
}
