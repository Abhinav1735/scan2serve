package com.scan2serve.entity;

import com.scan2serve.enums.EmployeeRole;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "employees",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_employee_username",
                        columnNames = "username"
                )
        }
)
public class Employee {

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // NAME
    // =========================================================

    @Column(
            nullable = false,
            length = 100
    )
    private String name;


    // =========================================================
    // USERNAME
    // =========================================================

    @Column(
            nullable = false,
            unique = true,
            length = 50
    )
    private String username;


    // =========================================================
    // PASSWORD
    // =========================================================

    @Column(
            nullable = false,
            length = 255
    )
    private String password;


    // =========================================================
    // ROLE
    // =========================================================

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private EmployeeRole role;


    // =========================================================
    // ACTIVE
    // =========================================================

    @Column(
            nullable = false
    )
    private boolean active = true;


    // =========================================================
    // CREATED AT
    // =========================================================

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;


    // =========================================================
    // UPDATED AT
    // =========================================================

    @Column(
            nullable = false
    )
    private LocalDateTime updatedAt;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Employee() {
    }


    // =========================================================
    // PRE PERSIST
    // =========================================================

    @PrePersist
    protected void onCreate() {

        LocalDateTime now =
                LocalDateTime.now();

        createdAt = now;

        updatedAt = now;
    }


    // =========================================================
    // PRE UPDATE
    // =========================================================

    @PreUpdate
    protected void onUpdate() {

        updatedAt =
                LocalDateTime.now();
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


    public String getPassword() {

        return password;
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


    public void setUsername(String username) {

        this.username = username;
    }


    public void setPassword(String password) {

        this.password = password;
    }


    public void setRole(EmployeeRole role) {

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