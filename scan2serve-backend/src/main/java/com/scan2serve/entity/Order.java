package com.scan2serve.entity;

import com.scan2serve.enums.OrderStatus;
import com.scan2serve.enums.PaymentMethod;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    // =========================================================
    // PRIMARY KEY
    // =========================================================

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;


    // =========================================================
    // TABLE NUMBER
    // =========================================================

    private Integer tableNumber;


    // =========================================================
    // CUSTOMER NAME
    // =========================================================

    @Column(
            name = "customer_name",
            length = 100
    )
    private String customerName;


    // =========================================================
    // CUSTOMER PHONE
    // =========================================================

    @Column(
            name = "customer_phone",
            length = 10
    )
    private String customerPhone;


    // =========================================================
    // SUBTOTAL
    // =========================================================
    //
    // Only READY and SERVED items are included.
    //
    // ORDER_PLACED -> excluded
    // PREPARING    -> excluded
    // READY        -> included
    // SERVED       -> included
    // CANCELLED    -> excluded
    //
    // =========================================================

    private Double subtotal;


    // =========================================================
    // GST PERCENTAGE
    // =========================================================
    //
    // Stores the GST percentage applicable to this order.
    //
    // Example:
    //
    // 5.0 means 5%
    //
    // This is persisted so historical bills retain the GST
    // percentage that was actually used.
    //
    // =========================================================

    @Column(
            name = "gst_percentage"
    )
    private Double gstPercentage;


    // =========================================================
    // GST AMOUNT
    // =========================================================

    private Double gst;


    // =========================================================
    // GRAND TOTAL
    // =========================================================
    //
    // subtotal + gst
    //
    // Calculated only from READY + SERVED items.
    //
    // =========================================================

    private Double grandTotal;


    // =========================================================
    // ORDER STATUS
    // =========================================================

    @Enumerated(EnumType.STRING)
    private OrderStatus status;


    // =========================================================
    // ORDER TIME
    // =========================================================

    private LocalDateTime orderTime;


    // =========================================================
    // KITCHEN CLOSED
    // =========================================================
    //
    // Payment does NOT automatically close Kitchen.
    //
    // Bill Desk payment:
    //
    // kitchenClosed = false
    //
    // Kitchen explicitly closes the order:
    //
    // kitchenClosed = true
    //
    // =========================================================

    @Column(
            nullable = false
    )
    private boolean kitchenClosed = false;


    // =========================================================
    // OLD BILL - PAYMENT TIME
    // =========================================================
    //
    // Populated from Payment.
    //
    // NOT stored as an Order database column.
    //
    // =========================================================

    @Transient
    private LocalDateTime paymentTime;


    // =========================================================
    // OLD BILL - PAYMENT METHOD
    // =========================================================
    //
    // Populated from Payment.
    //
    // NOT stored as an Order database column.
    //
    // =========================================================

    @Transient
    private PaymentMethod paymentMethod;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Order() {
    }


    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
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


    public OrderStatus getStatus() {
        return status;
    }


    public LocalDateTime getOrderTime() {
        return orderTime;
    }


    public boolean isKitchenClosed() {
        return kitchenClosed;
    }


    // =========================================================
    // OLD BILL - PAYMENT GETTERS
    // =========================================================

    public LocalDateTime getPaymentTime() {
        return paymentTime;
    }


    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }


    // =========================================================
    // SETTERS
    // =========================================================

    public void setId(
            Long id
    ) {
        this.id = id;
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


    public void setStatus(
            OrderStatus status
    ) {
        this.status = status;
    }


    public void setOrderTime(
            LocalDateTime orderTime
    ) {
        this.orderTime = orderTime;
    }


    public void setKitchenClosed(
            boolean kitchenClosed
    ) {
        this.kitchenClosed = kitchenClosed;
    }


    // =========================================================
    // OLD BILL - PAYMENT SETTERS
    // =========================================================

    public void setPaymentTime(
            LocalDateTime paymentTime
    ) {
        this.paymentTime = paymentTime;
    }


    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod = paymentMethod;
    }
}