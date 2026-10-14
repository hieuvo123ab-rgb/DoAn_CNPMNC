package com.edms.service;

import com.edms.dto.SavedSearchRequest;
import com.edms.dto.SavedSearchResponse;
import com.edms.entity.SavedSearch;
import com.edms.exception.ResourceNotFoundException;
import com.edms.repository.SavedSearchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavedSearchService {

    private final SavedSearchRepository savedSearchRepository;
    private final AuditService auditService;

    public SavedSearchService(SavedSearchRepository savedSearchRepository, AuditService auditService) {
        this.savedSearchRepository = savedSearchRepository;
        this.auditService = auditService;
    }

    @Transactional
    public SavedSearchResponse createSavedSearch(SavedSearchRequest request, String username) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên bộ lọc tìm kiếm không được để trống");
        }

        String query = (request.getQuery() != null && !request.getQuery().trim().isEmpty())
                ? request.getQuery().trim()
                : null;
        String documentType = (request.getDocumentType() != null && !request.getDocumentType().trim().isEmpty())
                ? request.getDocumentType().trim()
                : null;

        SavedSearch savedSearch = new SavedSearch(
                request.getName().trim(),
                query,
                documentType,
                request.getSearchScope(),
                username
        );
        // Phase 12: persist searchMode (defaults to LEXICAL if not provided)
        savedSearch.setSearchMode(request.getSearchMode());

        SavedSearch saved = savedSearchRepository.save(savedSearch);
        auditService.log(username, "SAVED_SEARCH_CREATE", "SAVED_SEARCH", saved.getId().toString(),
                "Lưu bộ lọc tìm kiếm: " + saved.getName(), null);
        return SavedSearchResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedSearchResponse> getMySavedSearches(String username) {
        return savedSearchRepository.findByCreatedByOrderByCreatedAtDesc(username)
                .stream()
                .map(SavedSearchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSavedSearch(Long id, String username) {
        SavedSearch savedSearch = savedSearchRepository.findByIdAndCreatedBy(id, username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bộ lọc tìm kiếm với ID: " + id));
        savedSearchRepository.delete(savedSearch);
        auditService.log(username, "SAVED_SEARCH_DELETE", "SAVED_SEARCH", id.toString(),
                "Xóa bộ lọc tìm kiếm: " + savedSearch.getName() + " (ID: " + id + ")", null);
    }
}
