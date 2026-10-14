package com.edms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SavedSearchRequest {

    @NotBlank(message = "Tên bộ lọc tìm kiếm không được để trống")
    @Size(max = 100, message = "Tên bộ lọc tối đa 100 ký tự")
    private String name;

    @Size(max = 255, message = "Từ khóa tìm kiếm tối đa 255 ký tự")
    private String query;

    @Size(max = 50, message = "Loại tài liệu tối đa 50 ký tự")
    private String documentType;

    @Size(max = 30, message = "Phạm vi tìm kiếm tối đa 30 ký tự")
    private String searchScope;

    // Phase 12: Search mode (LEXICAL, SEMANTIC, HYBRID)
    @Size(max = 30, message = "Chế độ tìm kiếm tối đa 30 ký tự")
    private String searchMode;

    public SavedSearchRequest() {
    }

    public SavedSearchRequest(String name, String query, String documentType) {
        this(name, query, documentType, "METADATA");
    }

    public SavedSearchRequest(String name, String query, String documentType, String searchScope) {
        this.name = name;
        this.query = query;
        this.documentType = documentType;
        this.searchScope = searchScope;
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

    public String getSearchScope() {
        return searchScope;
    }

    public void setSearchScope(String searchScope) {
        this.searchScope = searchScope;
    }

    // Phase 12: searchMode
    public String getSearchMode() {
        return searchMode;
    }

    public void setSearchMode(String searchMode) {
        this.searchMode = searchMode;
    }
}
