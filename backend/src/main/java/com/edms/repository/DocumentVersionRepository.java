package com.edms.repository;

import com.edms.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {

    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(Long documentId);

    Optional<DocumentVersion> findByDocumentIdAndVersionNumber(Long documentId, Integer versionNumber);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM DocumentVersion v WHERE v.document.id = :documentId")
    Integer findMaxVersionNumberByDocumentId(@Param("documentId") Long documentId);

    @Query("SELECT COALESCE(SUM(v.fileSize), 0) FROM DocumentVersion v")
    long sumAllVersionsFileSize();

    Optional<DocumentVersion> findFirstByFileHash(String fileHash);

    List<DocumentVersion> findAllByFileHash(String fileHash);
}
