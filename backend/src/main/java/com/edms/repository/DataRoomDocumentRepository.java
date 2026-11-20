package com.edms.repository;

import com.edms.entity.DataRoomDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataRoomDocumentRepository extends JpaRepository<DataRoomDocument, Long> {

    List<DataRoomDocument> findByRoomIdOrderByAddedAtDesc(Long roomId);

    Optional<DataRoomDocument> findByRoomIdAndDocumentId(Long roomId, Long documentId);

    boolean existsByRoomIdAndDocumentId(Long roomId, Long documentId);

    long countByRoomId(Long roomId);

    void deleteByRoomIdAndDocumentId(Long roomId, Long documentId);
}
