package com.scan2serve.entity;

import com.scan2serve.enums.OrderItemStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne
    private Order order;


    @ManyToOne
    private Menu menu;


    private Integer quantity;


    private Double price;


    // =========================
    // ITEM STATUS
    // =========================

    @Enumerated(EnumType.STRING)
    private OrderItemStatus status;


    // =========================
    // CONSTRUCTOR
    // =========================

    public OrderItem() {
    }


    // =========================
    // GETTERS
    // =========================

    public Long getId() {

        return id;
    }


    public Order getOrder() {

        return order;
    }


    public Menu getMenu() {

        return menu;
    }


    public Integer getQuantity() {

        return quantity;
    }


    public Double getPrice() {

        return price;
    }


    public OrderItemStatus getStatus() {

        return status;
    }


    // =========================
    // SETTERS
    // =========================

    public void setId(Long id) {

        this.id = id;
    }


    public void setOrder(Order order) {

        this.order = order;
    }


    public void setMenu(Menu menu) {

        this.menu = menu;
    }


    public void setQuantity(Integer quantity) {

        this.quantity = quantity;
    }


    public void setPrice(Double price) {

        this.price = price;
    }


    public void setStatus(OrderItemStatus status) {

        this.status = status;
    }

}