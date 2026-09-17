package com.scan2serve.dto;

import com.scan2serve.enums.OrderStatus;

public class OrderStatusRequest {

    private OrderStatus status;

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}