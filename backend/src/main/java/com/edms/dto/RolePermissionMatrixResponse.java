package com.edms.dto;

import java.util.List;
import java.util.Map;

public class RolePermissionMatrixResponse {

    public static class PermissionItem {
        private String code;
        private String name;
        private String description;
        private boolean granted;

        public PermissionItem() {
        }

        public PermissionItem(String code, String name, String description, boolean granted) {
            this.code = code;
            this.name = name;
            this.description = description;
            this.granted = granted;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isGranted() {
            return granted;
        }

        public void setGranted(boolean granted) {
            this.granted = granted;
        }
    }

    private Map<String, List<PermissionItem>> matrix;

    public RolePermissionMatrixResponse() {
    }

    public RolePermissionMatrixResponse(Map<String, List<PermissionItem>> matrix) {
        this.matrix = matrix;
    }

    public Map<String, List<PermissionItem>> getMatrix() {
        return matrix;
    }

    public void setMatrix(Map<String, List<PermissionItem>> matrix) {
        this.matrix = matrix;
    }
}
