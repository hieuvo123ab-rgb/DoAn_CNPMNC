package com.edms.repository;

import com.edms.entity.DataRoomInvitation;
import com.edms.entity.DataRoomInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataRoomInvitationRepository extends JpaRepository<DataRoomInvitation, Long> {

    Optional<DataRoomInvitation> findByToken(String token);

    List<DataRoomInvitation> findByRoomId(Long roomId);

    List<DataRoomInvitation> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    List<DataRoomInvitation> findByRoomIdAndStatus(Long roomId, DataRoomInvitationStatus status);

    Optional<DataRoomInvitation> findByRoomIdAndEmailAndStatus(Long roomId, String email, DataRoomInvitationStatus status);
}
