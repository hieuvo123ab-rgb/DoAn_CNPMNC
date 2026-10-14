package com.edms.model;

/**
 * Phase 13: Integrity status of a DocumentVersion's physical file.
 *
 * INTACT   — Current SHA-256 of the file matches the stored fileHash. File untampered.
 * TAMPERED — SHA-256 mismatch detected. File has been modified after upload.
 * UNKNOWN  — fileHash is null (document uploaded before Phase 13, hash not computed).
 */
public enum IntegrityStatus {
    INTACT,
    TAMPERED,
    UNKNOWN
}
