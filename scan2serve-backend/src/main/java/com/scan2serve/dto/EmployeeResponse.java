package com.scan2serve.dto;

import com.scan2serve.entity.Employee;
import com.scan2serve.enums.EmployeeRole;

import java.time.LocalDateTime;

public class EmployeeResponse {

    private Long id;

    private String name;

    private String username;

    private EmployeeRole role;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public EmployeeResponse() {
    }


    public EmployeeResponse(
            Employee employee
    ) {

        this.id =
                employee.getId();

        this.name =
                employee.getName();

        this.username =
                employee.getUsername();

        this.role =
                employee.getRole();

        this.active =
                employee.isActive();

        this.createdAt =
                employee.getCreatedAt();

        this.updatedAt =
                employee.getUpdatedAt();
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {

        return id;
    }


    public String getName() {

        return name;
    }


    public String getUsername() {

        return username;
    }


    public EmployeeRole getRole() {

        return role;
    }


    public boolean isActive() {

        return active;
    }


    public LocalDateTime getCreatedAt() {

        return createdAt;
    }


    public LocalDateTime getUpdatedAt() {

        return updatedAt;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(Long id) {

        this.id = id;
    }


    public void setName(String name) {

        this.name = name;
    }


    public void setUsername(
            String username
    ) {

        this.username = username;
    }


    public void setRole(
            EmployeeRole role
    ) {

        this.role = role;
    }


    public void setActive(boolean active) {

        this.active = active;
    }


    public void setCreatedAt(
            LocalDateTime createdAt
    ) {

        this.createdAt = createdAt;
    }


    public void setUpdatedAt(
            LocalDateTime updatedAt
    ) {

        this.updatedAt = updatedAt;
    }

}