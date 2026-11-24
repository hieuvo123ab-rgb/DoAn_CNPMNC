package com.edms.repository;

import com.edms.entity.DataRoomMember;
import com.edms.entity.DataRoomMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataRoomMemberRepository extends JpaRepository<DataRoomMember, Long> {

    List<DataRoomMember> findByRoomId(Long roomId);

    long countByRoomId(Long roomId);

    Optional<DataRoomMember> findByRoomIdAndUsername(Long roomId, String username);

    Optional<DataRoomMember> findByRoomIdAndEmail(Long roomId, String email);

    boolean existsByRoomIdAndUsername(Long roomId, String username);

    boolean existsByRoomIdAndEmail(Long roomId, String email);

    List<DataRoomMember> findByUsernameAndStatus(String username, DataRoomMemberStatus status);

    List<DataRoomMember> findByEmailAndStatus(String email, DataRoomMemberStatus status);
}
