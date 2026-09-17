package com.scan2serve.dto;

import com.scan2serve.enums.PaymentMethod;
import com.scan2serve.enums.PaymentStatus;

import java.time.LocalDateTime;

public class PaymentResponse {

    private Long paymentId;

    private Long orderId;

    private Double amount;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private LocalDateTime paymentTime;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public PaymentResponse() {
    }


    public PaymentResponse(
            Long paymentId,
            Long orderId,
            Double amount,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            LocalDateTime paymentTime
    ) {

        this.paymentId = paymentId;
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.paymentTime = paymentTime;
    }


    // =====================================================
    // GETTERS
    // =====================================================

    public Long getPaymentId() {
        return paymentId;
    }


    public Long getOrderId() {
        return orderId;
    }


    public Double getAmount() {
        return amount;
    }


    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }


    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }


    public LocalDateTime getPaymentTime() {
        return paymentTime;
    }


    // =====================================================
    // SETTERS
    // =====================================================

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }


    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }


    public void setAmount(Double amount) {
        this.amount = amount;
    }


    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {

        this.paymentMethod = paymentMethod;
    }


    public void setPaymentStatus(
            PaymentStatus paymentStatus
    ) {

        this.paymentStatus = paymentStatus;
    }


    public void setPaymentTime(
            LocalDateTime paymentTime
    ) {

        this.paymentTime = paymentTime;
    }
}