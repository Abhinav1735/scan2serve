package com.scan2serve.dto;

import com.scan2serve.enums.EmployeeRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EmployeeRequest {

    @NotBlank(message = "Employee name is required")
    private String name;

    @NotBlank(message = "Username is required")
    private String username;

    /*
     * Required when creating an employee.
     * Optional when updating an employee.
     */
    private String password;

    @NotNull(message = "Employee role is required")
    private EmployeeRole role;

    private Boolean active = true;

    public EmployeeRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public EmployeeRole getRole() {
        return role;
    }

    public void setRole(EmployeeRole role) {
        this.role = role;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}