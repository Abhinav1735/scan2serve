package com.scan2serve.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_table")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer tableNumber;

    @Column(nullable = false)
    private Boolean active;

    public RestaurantTable() {
    }

    public RestaurantTable(Long id, Integer tableNumber, Boolean active) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public Boolean getActive() {
        return active;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}