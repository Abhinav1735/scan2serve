package com.scan2serve.repository;

import com.scan2serve.entity.OrderItem;
import com.scan2serve.entity.PaymentItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface PaymentItemRepository
        extends JpaRepository<PaymentItem, Long> {


    // =====================================================
    // CHECK WHETHER AN ORDER ITEM IS ALREADY PAID
    // =====================================================

    boolean existsByOrderItem(
            OrderItem orderItem
    );


    // =====================================================
    // GET PAYMENT ITEMS FOR ORDER ITEM
    // =====================================================

    List<PaymentItem> findByOrderItem(
            OrderItem orderItem
    );


    // =====================================================
    // GET ALL PAYMENT ITEMS FOR PAYMENT
    // =====================================================

    List<PaymentItem> findByPaymentId(
            Long paymentId
    );
}