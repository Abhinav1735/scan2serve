package com.scan2serve.dto;

import com.scan2serve.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public class KitchenOrderResponse {

    private Long orderId;
    private Integer tableNumber;
    private OrderStatus orderStatus;
    private LocalDateTime orderTime;
    private Double totalAmount;
    private List<KitchenOrderItemResponse> items;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public KitchenOrderResponse() {
    }


    public KitchenOrderResponse(
            Long orderId,
            Integer tableNumber,
            OrderStatus orderStatus,
            LocalDateTime orderTime,
            Double totalAmount,
            List<KitchenOrderItemResponse> items
    ) {

        this.orderId = orderId;
        this.tableNumber = tableNumber;
        this.orderStatus = orderStatus;
        this.orderTime = orderTime;
        this.totalAmount = totalAmount;
        this.items = items;
    }


    // =====================================================
    // GETTERS
    // =====================================================

    public Long getOrderId() {
        return orderId;
    }


    public Integer getTableNumber() {
        return tableNumber;
    }


    public OrderStatus getOrderStatus() {
        return orderStatus;
    }


    public LocalDateTime getOrderTime() {
        return orderTime;
    }


    public Double getTotalAmount() {
        return totalAmount;
    }


    public List<KitchenOrderItemResponse> getItems() {
        return items;
    }


    // =====================================================
    // SETTERS
    // =====================================================

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }


    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }


    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }


    public void setOrderTime(LocalDateTime orderTime) {
        this.orderTime = orderTime;
    }


    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }


    public void setItems(
            List<KitchenOrderItemResponse> items
    ) {

        this.items = items;
    }
}