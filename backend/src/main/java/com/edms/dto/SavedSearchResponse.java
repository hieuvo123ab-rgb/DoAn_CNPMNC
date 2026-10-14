package com.edms.dto;

import com.edms.entity.SavedSearch;
import java.time.Instant;

public class SavedSearchResponse {

    private Long id;
    private String name;
    private String query;
    private String documentType;
    private String searchScope;
    private String searchMode;  // Phase 12: LEXICAL, SEMANTIC, HYBRID
    private String createdBy;
    private Instant createdAt;

    public SavedSearchResponse() {
    }

    public SavedSearchResponse(Long id, String name, String query, String documentType, String searchScope, String searchMode, String createdBy, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.query = query;
        this.documentType = documentType;
        this.searchScope = (searchScope != null && !searchScope.isBlank()) ? searchScope : "METADATA";
        this.searchMode = (searchMode != null && !searchMode.isBlank()) ? searchMode : "LEXICAL";
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public static SavedSearchResponse fromEntity(SavedSearch entity) {
        return new SavedSearchResponse(
                entity.getId(),
                entity.getName(),
                entity.getQuery(),
                entity.getDocumentType(),
                entity.getSearchScope(),
                entity.getSearchMode(),  // Phase 12
                entity.getCreatedBy(),
                entity.getCreatedAt()
        );
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
        return searchScope != null ? searchScope : "METADATA";
    }

    public void setSearchScope(String searchScope) {
        this.searchScope = searchScope;
    }

    // Phase 12: searchMode
    public String getSearchMode() {
        return searchMode != null ? searchMode : "LEXICAL";
    }

    public void setSearchMode(String searchMode) {
        this.searchMode = searchMode;
    }
}
