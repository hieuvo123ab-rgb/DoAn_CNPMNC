package com.edms.repository;

import com.edms.entity.DocumentSemanticChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Phase 12: Repository for DocumentSemanticChunk.
 * ACL filtering must be applied BEFORE calling findByDocumentVersionIdInAndEmbeddingModel.
 */
@Repository
public interface DocumentSemanticChunkRepository extends JpaRepository<DocumentSemanticChunk, Long> {

    /** Load all chunks for a specific version and model. */
    List<DocumentSemanticChunk> findByDocumentVersionIdAndEmbeddingModel(
            Long documentVersionId, String embeddingModel);

    /**
     * Load chunks for a set of authorized document version IDs and a specific model.
     * Called AFTER ACL filtering — private doc version IDs must NOT be in the list.
     */
    @Query("SELECT c FROM DocumentSemanticChunk c WHERE c.documentVersionId IN :versionIds AND c.embeddingModel = :model")
    List<DocumentSemanticChunk> findByDocumentVersionIdInAndEmbeddingModel(
            @Param("versionIds") List<Long> versionIds,
            @Param("model") String model);

    /** Delete all chunks for a version + model (used for rebuild). */
    @Modifying
    @Transactional
    @Query("DELETE FROM DocumentSemanticChunk c WHERE c.documentVersionId = :versionId AND c.embeddingModel = :model")
    void deleteByDocumentVersionIdAndEmbeddingModel(
            @Param("versionId") Long versionId,
            @Param("model") String model);

    /** Count chunks for a specific version and model. */
    long countByDocumentVersionIdAndEmbeddingModel(Long documentVersionId, String embeddingModel);

    /** Check if chunk exists (for dedup/skip optimization). */
    boolean existsByDocumentVersionIdAndChunkIndexAndEmbeddingModel(
            Long documentVersionId, Integer chunkIndex, String embeddingModel);
}
