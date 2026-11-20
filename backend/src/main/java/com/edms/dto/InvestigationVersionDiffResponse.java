package com.edms.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class InvestigationVersionDiffResponse {

    private Long documentId;
    private String documentTitle;
    private Integer versionA;
    private Integer versionB;
    private String hashA;
    private String hashB;
    private boolean hashMatch;
    private Instant createdAtA;
    private Instant createdAtB;
    private String createdByA;
    private String createdByB;
    private Long fileSizeA;
    private Long fileSizeB;
    private String fileNameA;
    private String fileNameB;
    private Map<String, Object> metaDiff;
    private List<DiffLine> diffLines;

    public static class DiffLine {
        private String type; // "EQUAL", "INSERT", "DELETE"
        private Integer lineNumberA;
        private Integer lineNumberB;
        private String text;

        public DiffLine() {
        }

        public DiffLine(String type, Integer lineNumberA, Integer lineNumberB, String text) {
            this.type = type;
            this.lineNumberA = lineNumberA;
            this.lineNumberB = lineNumberB;
            this.text = text;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Integer getLineNumberA() {
            return lineNumberA;
        }

        public void setLineNumberA(Integer lineNumberA) {
            this.lineNumberA = lineNumberA;
        }

        public Integer getLineNumberB() {
            return lineNumberB;
        }

        public void setLineNumberB(Integer lineNumberB) {
            this.lineNumberB = lineNumberB;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getDocumentTitle() {
        return documentTitle;
    }

    public void setDocumentTitle(String documentTitle) {
        this.documentTitle = documentTitle;
    }

    public Integer getVersionA() {
        return versionA;
    }

    public void setVersionA(Integer versionA) {
        this.versionA = versionA;
    }

    public Integer getVersionB() {
        return versionB;
    }

    public void setVersionB(Integer versionB) {
        this.versionB = versionB;
    }

    public String getHashA() {
        return hashA;
    }

    public void setHashA(String hashA) {
        this.hashA = hashA;
    }

    public String getHashB() {
        return hashB;
    }

    public void setHashB(String hashB) {
        this.hashB = hashB;
    }

    public boolean isHashMatch() {
        return hashMatch;
    }

    public void setHashMatch(boolean hashMatch) {
        this.hashMatch = hashMatch;
    }

    public Instant getCreatedAtA() {
        return createdAtA;
    }

    public void setCreatedAtA(Instant createdAtA) {
        this.createdAtA = createdAtA;
    }

    public Instant getCreatedAtB() {
        return createdAtB;
    }

    public void setCreatedAtB(Instant createdAtB) {
        this.createdAtB = createdAtB;
    }

    public String getCreatedByA() {
        return createdByA;
    }

    public void setCreatedByA(String createdByA) {
        this.createdByA = createdByA;
    }

    public String getCreatedByB() {
        return createdByB;
    }

    public void setCreatedByB(String createdByB) {
        this.createdByB = createdByB;
    }

    public Long getFileSizeA() {
        return fileSizeA;
    }

    public void setFileSizeA(Long fileSizeA) {
        this.fileSizeA = fileSizeA;
    }

    public Long getFileSizeB() {
        return fileSizeB;
    }

    public void setFileSizeB(Long fileSizeB) {
        this.fileSizeB = fileSizeB;
    }

    public String getFileNameA() {
        return fileNameA;
    }

    public void setFileNameA(String fileNameA) {
        this.fileNameA = fileNameA;
    }

    public String getFileNameB() {
        return fileNameB;
    }

    public void setFileNameB(String fileNameB) {
        this.fileNameB = fileNameB;
    }

    public Map<String, Object> getMetaDiff() {
        return metaDiff;
    }

    public void setMetaDiff(Map<String, Object> metaDiff) {
        this.metaDiff = metaDiff;
    }

    public List<DiffLine> getDiffLines() {
        return diffLines;
    }

    public void setDiffLines(List<DiffLine> diffLines) {
        this.diffLines = diffLines;
    }
}
