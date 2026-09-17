package com.scan2serve.dto;

import com.scan2serve.enums.OrderStatus;

import java.time.LocalDateTime;

public class CustomerOrderResponse {

    private Long id;
    private Integer tableNumber;
    private Double totalAmount;
    private OrderStatus status;
    private LocalDateTime orderTime;

    public CustomerOrderResponse() {
    }

    public CustomerOrderResponse(Long id,
                                 Integer tableNumber,
                                 Double totalAmount,
                                 OrderStatus status,
                                 LocalDateTime orderTime) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderTime = orderTime;
    }

    public Long getId() {
        return id;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public LocalDateTime getOrderTime() {
        return orderTime;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public void setOrderTime(LocalDateTime orderTime) {
        this.orderTime = orderTime;
    }
}