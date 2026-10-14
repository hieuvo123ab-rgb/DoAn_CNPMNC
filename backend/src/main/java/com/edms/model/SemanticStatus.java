package com.edms.model;

/**
 * Phase 12: Semantic indexing status for a DocumentVersion.
 */
public enum SemanticStatus {
    /** No content available to embed (binary only, no extraction). */
    NOT_REQUIRED,
    /** Queued for semantic indexing. */
    PENDING,
    /** Successfully indexed with embedding vectors. */
    READY,
    /** Embedding failed; LEXICAL search still works. */
    FAILED,
    /** Skipped (e.g., DISPOSED version, no meaningful text). */
    SKIPPED
}
