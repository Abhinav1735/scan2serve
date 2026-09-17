package com.scan2serve.dto;

import com.scan2serve.enums.OrderItemStatus;

public class OrderItemStatusRequest {

    private OrderItemStatus status;


    public OrderItemStatus getStatus() {

        return status;
    }


    public void setStatus(
            OrderItemStatus status
    ) {

        this.status = status;
    }

}