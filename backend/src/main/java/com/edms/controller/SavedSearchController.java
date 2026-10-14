package com.edms.controller;

import com.edms.dto.SavedSearchRequest;
import com.edms.dto.SavedSearchResponse;
import com.edms.service.SavedSearchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/saved-searches")
public class SavedSearchController {

    private final SavedSearchService savedSearchService;

    public SavedSearchController(SavedSearchService savedSearchService) {
        this.savedSearchService = savedSearchService;
    }

    @PostMapping
    public ResponseEntity<SavedSearchResponse> createSavedSearch(
            @Valid @RequestBody SavedSearchRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        SavedSearchResponse response = savedSearchService.createSavedSearch(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SavedSearchResponse>> getMySavedSearches(Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        List<SavedSearchResponse> response = savedSearchService.getMySavedSearches(username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedSearch(@PathVariable("id") Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "anonymous";
        savedSearchService.deleteSavedSearch(id, username);
        return ResponseEntity.noContent().build();
    }
}
