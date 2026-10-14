package com.edms.repository;

import com.edms.entity.DocumentPermission;
import com.edms.entity.PermissionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {

    List<DocumentPermission> findByDocumentId(Long documentId);

    Optional<DocumentPermission> findByDocumentIdAndUserId(Long documentId, Long userId);

    @Modifying
    @Query("DELETE FROM DocumentPermission dp WHERE dp.document.id = :documentId AND dp.user.id = :userId")
    void deleteByDocumentIdAndUserId(@Param("documentId") Long documentId, @Param("userId") Long userId);

    @Query("SELECT dp.permission FROM DocumentPermission dp WHERE dp.document.id = :documentId AND dp.user.id = :userId")
    Optional<PermissionType> findPermission(@Param("documentId") Long documentId, @Param("userId") Long userId);

    @Query("SELECT dp.document.id FROM DocumentPermission dp WHERE dp.user.id = :userId")
    List<Long> findDocumentIdsSharedWithUser(@Param("userId") Long userId);

    @Query("SELECT dp FROM DocumentPermission dp JOIN FETCH dp.document d WHERE dp.user.id = :userId ORDER BY d.createdAt DESC")
    List<DocumentPermission> findSharedWithUser(@Param("userId") Long userId);
}
