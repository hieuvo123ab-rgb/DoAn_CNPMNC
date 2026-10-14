package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "saved_searches")
public class SavedSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "search_query", length = 255)
    private String query;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "search_scope", length = 30, columnDefinition = "VARCHAR(30) DEFAULT 'METADATA'")
    private String searchScope = "METADATA";

    // Phase 12: Search mode (LEXICAL, SEMANTIC, HYBRID). Existing saved searches default to LEXICAL.
    @Column(name = "search_mode", length = 30, columnDefinition = "VARCHAR(30) DEFAULT 'LEXICAL'")
    private String searchMode = "LEXICAL";

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public SavedSearch() {
    }

    public SavedSearch(String name, String query, String documentType, String createdBy) {
        this(name, query, documentType, "METADATA", createdBy);
    }

    public SavedSearch(String name, String query, String documentType, String searchScope, String createdBy) {
        this.name = name;
        this.query = query;
        this.documentType = documentType;
        this.searchScope = (searchScope != null && !searchScope.isBlank()) ? searchScope.trim().toUpperCase() : "METADATA";
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.searchScope == null || this.searchScope.isBlank()) {
            this.searchScope = "METADATA";
        }
        if (this.searchMode == null || this.searchMode.isBlank()) {
            this.searchMode = "LEXICAL";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getSearchScope() {
        return (searchScope != null && !searchScope.isBlank()) ? searchScope : "METADATA";
    }

    public void setSearchScope(String searchScope) {
        this.searchScope = (searchScope != null && !searchScope.isBlank()) ? searchScope.trim().toUpperCase() : "METADATA";
    }

    // Phase 12: Search mode getters/setters
    public String getSearchMode() {
        return (searchMode != null && !searchMode.isBlank()) ? searchMode : "LEXICAL";
    }

    public void setSearchMode(String searchMode) {
        this.searchMode = (searchMode != null && !searchMode.isBlank()) ? searchMode.trim().toUpperCase() : "LEXICAL";
    }
}
