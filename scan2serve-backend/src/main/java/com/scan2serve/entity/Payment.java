package com.scan2serve.entity;

import com.scan2serve.enums.PaymentMethod;
import com.scan2serve.enums.PaymentStatus;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =====================================================
    // ORDER
    // =====================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "order_id",
            nullable = false
    )
    private Order order;


    // =====================================================
    // AMOUNT
    // =====================================================

    @Column(
            nullable = false
    )
    private Double amount;


    // =====================================================
    // PAYMENT METHOD
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false
    )
    private PaymentMethod paymentMethod;


    // =====================================================
    // PAYMENT STATUS
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false
    )
    private PaymentStatus paymentStatus;


    // =====================================================
    // PAYMENT TIME
    // =====================================================

    @Column(
            nullable = false
    )
    private LocalDateTime paymentTime;


    // =====================================================
    // PAID ITEMS
    // =====================================================

    @OneToMany(
            mappedBy = "payment",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PaymentItem> paymentItems =
            new ArrayList<>();


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public Payment() {
    }


    // =====================================================
    // GETTERS
    // =====================================================

    public Long getId() {
        return id;
    }


    public Order getOrder() {
        return order;
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


    public List<PaymentItem> getPaymentItems() {
        return paymentItems;
    }


    // =====================================================
    // SETTERS
    // =====================================================

    public void setId(Long id) {
        this.id = id;
    }


    public void setOrder(Order order) {
        this.order = order;
    }


    public void setAmount(Double amount) {
        this.amount = amount;
    }


    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod =
                paymentMethod;
    }


    public void setPaymentStatus(
            PaymentStatus paymentStatus
    ) {
        this.paymentStatus =
                paymentStatus;
    }


    public void setPaymentTime(
            LocalDateTime paymentTime
    ) {
        this.paymentTime =
                paymentTime;
    }


    public void setPaymentItems(
            List<PaymentItem> paymentItems
    ) {
        this.paymentItems =
                paymentItems;
    }


    // =====================================================
    // HELPER
    // =====================================================

    public void addPaymentItem(
            PaymentItem paymentItem
    ) {

        paymentItems.add(
                paymentItem
        );

        paymentItem.setPayment(
                this
        );
    }
}