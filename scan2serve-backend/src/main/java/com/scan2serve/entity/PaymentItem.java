package com.scan2serve.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "payment_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_payment_item_order_item",
                        columnNames = "order_item_id"
                )
        }
)
public class PaymentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =====================================================
    // PAYMENT
    // =====================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "payment_id",
            nullable = false
    )
    private Payment payment;


    // =====================================================
    // ORDER ITEM
    // =====================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "order_item_id",
            nullable = false
    )
    private OrderItem orderItem;


    // =====================================================
    // AMOUNT PAID FOR THIS ITEM
    // =====================================================

    @Column(
            nullable = false
    )
    private Double amount;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public PaymentItem() {
    }


    // =====================================================
    // GETTERS
    // =====================================================

    public Long getId() {
        return id;
    }


    public Payment getPayment() {
        return payment;
    }


    public OrderItem getOrderItem() {
        return orderItem;
    }


    public Double getAmount() {
        return amount;
    }


    // =====================================================
    // SETTERS
    // =====================================================

    public void setId(Long id) {
        this.id = id;
    }


    public void setPayment(Payment payment) {
        this.payment = payment;
    }


    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }


    public void setAmount(Double amount) {
        this.amount = amount;
    }
}