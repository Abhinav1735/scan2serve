package com.scan2serve.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer tableNumber;

    @ManyToOne
    @JoinColumn(name = "menu_id")
    private Menu menu;

    private Integer quantity;

    public Cart() {
    }

    public Long getId() {
        return id;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public Menu getMenu() {
        return menu;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}