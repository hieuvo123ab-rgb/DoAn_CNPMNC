package com.edms.dto;

import com.edms.entity.DocumentVersion;
import org.springframework.core.io.Resource;

public class VersionResourceWrapper {

    private final Resource resource;
    private final DocumentVersion version;

    public VersionResourceWrapper(Resource resource, DocumentVersion version) {
        this.resource = resource;
        this.version = version;
    }

    public Resource getResource() {
        return resource;
    }

    public DocumentVersion getVersion() {
        return version;
    }
}
