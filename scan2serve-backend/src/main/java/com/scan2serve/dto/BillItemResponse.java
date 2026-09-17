package com.scan2serve.dto;


// =========================================================
// BILL ITEM RESPONSE
// =========================================================
//
// Used by:
// - Customer Bill
// - Bill Desk
//
// itemId is included so Bill Desk can identify the exact
// OrderItem when the user wants to cancel an individual item.
//
// =========================================================

public class BillItemResponse {


    // =========================================================
    // ORDER ITEM ID
    // =========================================================

    private Long itemId;


    // =========================================================
    // ITEM NAME
    // =========================================================

    private String itemName;


    // =========================================================
    // QUANTITY
    // =========================================================

    private Integer quantity;


    // =========================================================
    // UNIT PRICE
    // =========================================================

    private Double unitPrice;


    // =========================================================
    // TOTAL PRICE
    // =========================================================

    private Double totalPrice;


    // =========================================================
    // ITEM STATUS
    // =========================================================

    private String status;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public BillItemResponse() {
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getItemId() {
        return itemId;
    }


    public String getItemName() {
        return itemName;
    }


    public Integer getQuantity() {
        return quantity;
    }


    public Double getUnitPrice() {
        return unitPrice;
    }


    public Double getTotalPrice() {
        return totalPrice;
    }


    public String getStatus() {
        return status;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setItemId(
            Long itemId
    ) {
        this.itemId = itemId;
    }


    public void setItemName(
            String itemName
    ) {
        this.itemName = itemName;
    }


    public void setQuantity(
            Integer quantity
    ) {
        this.quantity = quantity;
    }


    public void setUnitPrice(
            Double unitPrice
    ) {
        this.unitPrice = unitPrice;
    }


    public void setTotalPrice(
            Double totalPrice
    ) {
        this.totalPrice = totalPrice;
    }


    public void setStatus(
            String status
    ) {
        this.status = status;
    }
}