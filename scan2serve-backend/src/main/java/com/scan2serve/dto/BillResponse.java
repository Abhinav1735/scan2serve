package com.scan2serve.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BillResponse {

    // =========================================================
    // ORDER INFORMATION
    // =========================================================

    private Long orderId;

    private Integer tableNumber;


    // =========================================================
    // CUSTOMER INFORMATION
    // =========================================================

    private String customerName;

    private String customerPhone;


    // =========================================================
    // BILL ITEMS
    // =========================================================

    private List<BillItemResponse> items;


    // =========================================================
    // BILL TOTALS
    // =========================================================

    private Double subtotal;

    private Double gstPercentage;

    private Double gst;

    private Double grandTotal;


    // =========================================================
    // ORDER / PAYMENT TIME
    // =========================================================

    private LocalDateTime orderTime;

    private LocalDateTime paymentTime;


    // =========================================================
    // PAYMENT INFORMATION
    // =========================================================

    private String paymentStatus;

    private String paymentMethod;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public BillResponse() {
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getOrderId() {
        return orderId;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public List<BillItemResponse> getItems() {
        return items;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public Double getGstPercentage() {
        return gstPercentage;
    }

    public Double getGst() {
        return gst;
    }

    public Double getGrandTotal() {
        return grandTotal;
    }

    public LocalDateTime getOrderTime() {
        return orderTime;
    }

    public LocalDateTime getPaymentTime() {
        return paymentTime;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setOrderId(
            Long orderId
    ) {
        this.orderId = orderId;
    }

    public void setTableNumber(
            Integer tableNumber
    ) {
        this.tableNumber = tableNumber;
    }

    public void setCustomerName(
            String customerName
    ) {
        this.customerName = customerName;
    }

    public void setCustomerPhone(
            String customerPhone
    ) {
        this.customerPhone = customerPhone;
    }

    public void setItems(
            List<BillItemResponse> items
    ) {
        this.items = items;
    }

    public void setSubtotal(
            Double subtotal
    ) {
        this.subtotal = subtotal;
    }

    public void setGstPercentage(
            Double gstPercentage
    ) {
        this.gstPercentage = gstPercentage;
    }

    public void setGst(
            Double gst
    ) {
        this.gst = gst;
    }

    public void setGrandTotal(
            Double grandTotal
    ) {
        this.grandTotal = grandTotal;
    }

    public void setOrderTime(
            LocalDateTime orderTime
    ) {
        this.orderTime = orderTime;
    }

    public void setPaymentTime(
            LocalDateTime paymentTime
    ) {
        this.paymentTime = paymentTime;
    }

    public void setPaymentStatus(
            String paymentStatus
    ) {
        this.paymentStatus = paymentStatus;
    }

    public void setPaymentMethod(
            String paymentMethod
    ) {
        this.paymentMethod = paymentMethod;
    }
}