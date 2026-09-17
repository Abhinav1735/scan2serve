package com.scan2serve.dto;

import com.scan2serve.enums.OrderItemStatus;

public class KitchenOrderItemResponse {

    private Long itemId;

    private Long menuId;

    private String itemName;

    private Integer quantity;

    private Double price;

    private OrderItemStatus status;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public KitchenOrderItemResponse() {
    }


    public KitchenOrderItemResponse(
            Long itemId,
            Long menuId,
            String itemName,
            Integer quantity,
            Double price,
            OrderItemStatus status
    ) {

        this.itemId = itemId;

        this.menuId = menuId;

        this.itemName = itemName;

        this.quantity = quantity;

        this.price = price;

        this.status = status;
    }


    // =====================================================
    // GETTERS
    // =====================================================

    public Long getItemId() {
        return itemId;
    }


    public Long getMenuId() {
        return menuId;
    }


    public String getItemName() {
        return itemName;
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


    // =====================================================
    // SETTERS
    // =====================================================

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }


    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }


    public void setItemName(String itemName) {
        this.itemName = itemName;
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