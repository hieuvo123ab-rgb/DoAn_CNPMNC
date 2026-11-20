package com.edms.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vdr_documents", uniqueConstraints = {
    @UniqueConstraint(name = "uq_vdr_room_doc", columnNames = {"room_id", "document_id"})
}, indexes = {
    @Index(name = "idx_vdrdoc_room_id", columnList = "room_id"),
    @Index(name = "idx_vdrdoc_doc_id", columnList = "document_id")
})
public class DataRoomDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "folder_path", length = 255)
    private String folderPath = "/";

    @Column(name = "added_by", nullable = false, length = 50)
    private String addedBy;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    public DataRoomDocument() {
    }

    @PrePersist
    public void prePersist() {
        if (this.addedAt == null) {
            this.addedAt = Instant.now();
        }
        if (this.folderPath == null || this.folderPath.isBlank()) {
            this.folderPath = "/";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getFolderPath() {
        return folderPath;
    }

    public void setFolderPath(String folderPath) {
        this.folderPath = folderPath;
    }

    public String getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(String addedBy) {
        this.addedBy = addedBy;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
