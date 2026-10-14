package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Phase 12: Stores a single text chunk and its embedding vector for semantic search.
 *
 * Each DocumentVersion may have multiple chunks. Embedding is stored as a raw
 * little-endian float32 byte array (BYTEA in PostgreSQL). Cosine similarity is
 * computed in Java on ACL-filtered candidate sets; no vector DB required.
 *
 * Raw chunkText and embeddingBytes are NEVER exposed through REST APIs.
 */
@Entity
@Table(
    name = "document_semantic_chunks",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_semantic_chunk",
            columnNames = {"document_version_id", "chunk_index", "embedding_model"}
        )
    }
)
public class DocumentSemanticChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_version_id", nullable = false)
    private Long documentVersionId;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    /**
     * Plain text of this chunk — NOT exposed through REST.
     * Used for snippet generation (authorized paths only).
     */
    @Column(name = "chunk_text", columnDefinition = "TEXT")
    private String chunkText;

    /**
     * Little-endian float32 byte array of the embedding vector.
     * Length = embeddingDimension * 4 bytes. NOT exposed through REST.
     */
    @Column(name = "embedding_bytes", columnDefinition = "BYTEA")
    private byte[] embeddingBytes;

    /**
     * Model identifier, e.g. "multilingual-e5-small-onnx-int8-v1".
     * Used to filter chunks by current model when searching.
     */
    @Column(name = "embedding_model", nullable = false, length = 100)
    private String embeddingModel;

    @Column(name = "embedding_dimension")
    private Integer embeddingDimension;

    /**
     * SHA-256 of chunkText. Used for deduplication/skip-on-unchanged optimization.
     */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public DocumentSemanticChunk() {
    }

    public DocumentSemanticChunk(Long documentVersionId, Integer chunkIndex, String chunkText,
                                 byte[] embeddingBytes, String embeddingModel, Integer embeddingDimension,
                                 String contentHash) {
        this.documentVersionId = documentVersionId;
        this.chunkIndex = chunkIndex;
        this.chunkText = chunkText;
        this.embeddingBytes = embeddingBytes;
        this.embeddingModel = embeddingModel;
        this.embeddingDimension = embeddingDimension;
        this.contentHash = contentHash;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDocumentVersionId() { return documentVersionId; }
    public void setDocumentVersionId(Long documentVersionId) { this.documentVersionId = documentVersionId; }

    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }

    public String getChunkText() { return chunkText; }
    public void setChunkText(String chunkText) { this.chunkText = chunkText; }

    public byte[] getEmbeddingBytes() { return embeddingBytes; }
    public void setEmbeddingBytes(byte[] embeddingBytes) { this.embeddingBytes = embeddingBytes; }

    public String getEmbeddingModel() { return embeddingModel; }
    public void setEmbeddingModel(String embeddingModel) { this.embeddingModel = embeddingModel; }

    public Integer getEmbeddingDimension() { return embeddingDimension; }
    public void setEmbeddingDimension(Integer embeddingDimension) { this.embeddingDimension = embeddingDimension; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
