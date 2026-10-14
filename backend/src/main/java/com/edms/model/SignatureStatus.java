package com.edms.model;

/**
 * Phase 13: Status of the digital signature on a DocumentVersion.
 *
 * UNSIGNED  — Version has never been signed.
 * VALID     — Signature present and cryptographically valid (RSA SHA256withRSA).
 * INVALID   — Signature present but verification failed (key mismatch or corrupted bytes).
 */
public enum SignatureStatus {
    UNSIGNED,
    VALID,
    INVALID
}
