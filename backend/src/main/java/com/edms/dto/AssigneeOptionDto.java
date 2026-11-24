package com.edms.dto;

public class AssigneeOptionDto {

    private String username;
    private String fullName;
    private String email;
    private String role;

    public AssigneeOptionDto() {
    }

    public AssigneeOptionDto(String username, String fullName, String email, String role) {
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
