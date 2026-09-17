package com.scan2serve.service;

import com.scan2serve.dto.BillResponse;
import com.scan2serve.dto.PaymentResponse;

import com.scan2serve.entity.Order;
import com.scan2serve.entity.OrderItem;
import com.scan2serve.entity.Payment;

import com.scan2serve.enums.OrderItemStatus;
import com.scan2serve.enums.OrderStatus;
import com.scan2serve.enums.PaymentMethod;
import com.scan2serve.enums.PaymentStatus;

import com.scan2serve.exception.custom.PaymentNotFoundException;

import com.scan2serve.repository.CartRepository;
import com.scan2serve.repository.OrderItemRepository;
import com.scan2serve.repository.OrderRepository;
import com.scan2serve.repository.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Service
@Transactional
public class PaymentService {


    // =========================================================
    // REPOSITORIES
    // =========================================================

    @Autowired
    private OrderRepository orderRepository;


    @Autowired
    private PaymentRepository paymentRepository;


    @Autowired
    private OrderItemRepository orderItemRepository;


    @Autowired
    private CartRepository cartRepository;


    // =========================================================
    // SERVICES
    // =========================================================

    @Autowired
    private OrderService orderService;


    // =========================================================
    // BILL DESK - PROCESS PAYMENT
    // =========================================================
    //
    // BILLING RULE:
    //
    // READY
    // SERVED
    //       ↓
    // BILLABLE
    //
    // ORDER_PLACED
    // PREPARING
    // CANCELLED
    //       ↓
    // NOT BILLABLE
    //
    // After payment:
    //
    // READY
    // SERVED
    //       ↓
    // remain unchanged
    //
    // ORDER_PLACED
    // PREPARING
    //       ↓
    // CANCELLED
    //
    // ENTIRE ORDER
    //       ↓
    // PAID
    //
    // =========================================================

    public PaymentResponse processPayment(
            Long orderId,
            PaymentMethod paymentMethod
    ) {

        // =====================================================
        // VALIDATE PAYMENT METHOD
        // =====================================================

        if (paymentMethod == null) {

            throw new IllegalArgumentException(
                    "Payment method is required"
            );
        }


        // =====================================================
        // FIND ORDER
        // =====================================================

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );


        // =====================================================
        // CHECK IF ORDER IS ALREADY PAID
        // =====================================================

        if (
                order.getStatus()
                        == OrderStatus.PAID
        ) {

            throw new IllegalStateException(
                    "Order is already paid"
            );
        }


        // =====================================================
        // CHECK IF ORDER IS CANCELLED
        // =====================================================

        if (
                order.getStatus()
                        == OrderStatus.CANCELLED
        ) {

            throw new IllegalStateException(
                    "Payment is not allowed for a cancelled order"
            );
        }


        // =====================================================
        // GET ALL ORDER ITEMS
        // =====================================================

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder(
                        order
                );


        // =====================================================
        // CHECK BILLABLE ITEMS
        // =====================================================
        //
        // Payment is allowed only when at least one item is:
        //
        // READY
        // OR
        // SERVED
        //
        // =====================================================

        boolean hasBillableItem =
                false;


        for (
                OrderItem item : orderItems
        ) {

            OrderItemStatus status =
                    item.getStatus();


            if (
                    status == OrderItemStatus.READY
                            ||
                            status == OrderItemStatus.SERVED
            ) {

                hasBillableItem =
                        true;

                break;
            }
        }


        // =====================================================
        // NO BILLABLE ITEM
        // =====================================================

        if (!hasBillableItem) {

            throw new IllegalStateException(
                    "Payment is allowed only when at least one item is READY or SERVED"
            );
        }


        // =====================================================
        // CHECK EXISTING PAYMENT
        // =====================================================

        if (
                paymentRepository.existsByOrder(
                        order
                )
        ) {

            throw new IllegalStateException(
                    "Payment already exists for this order"
            );
        }


        // =====================================================
        // GENERATE FINAL BILL
        // =====================================================
        //
        // OrderService.generateBill() is responsible for
        // calculating the final amount.
        //
        // Only READY and SERVED items contribute to:
        //
        // Subtotal
        // GST
        // Grand Total
        //
        // =====================================================

        BillResponse bill =
                orderService.generateBill(
                        orderId
                );


        // =====================================================
        // SAFETY CHECK
        // =====================================================

        if (bill == null) {

            throw new IllegalStateException(
                    "Unable to generate bill"
            );
        }


        // =====================================================
        // SAFETY CHECK FOR GRAND TOTAL
        // =====================================================

        if (
                bill.getGrandTotal() <= 0
        ) {

            throw new IllegalStateException(
                    "Payment amount must be greater than zero"
            );
        }


        // =====================================================
        // CREATE PAYMENT TIMESTAMP
        // =====================================================
        //
        // This timestamp is saved permanently inside the
        // Payment entity.
        //
        // =====================================================

        LocalDateTime paymentTime =
                LocalDateTime.now();


        // =====================================================
        // CREATE PAYMENT
        // =====================================================

        Payment payment =
                new Payment();


        // =====================================================
        // LINK PAYMENT TO ORDER
        // =====================================================

        payment.setOrder(
                order
        );


        // =====================================================
        // SET PAYMENT AMOUNT
        // =====================================================

        payment.setAmount(
                bill.getGrandTotal()
        );


        // =====================================================
        // SET PAYMENT METHOD
        // =====================================================

        payment.setPaymentMethod(
                paymentMethod
        );


        // =====================================================
        // SET PAYMENT STATUS
        // =====================================================

        payment.setPaymentStatus(
                PaymentStatus.COMPLETED
        );


        // =====================================================
        // SET PAYMENT TIME
        // =====================================================

        payment.setPaymentTime(
                paymentTime
        );


        // =====================================================
        // SAVE PAYMENT
        // =====================================================
        //
        // paymentTime and paymentMethod are now persisted
        // through the Payment table.
        //
        // =====================================================

        payment =
                paymentRepository.save(
                        payment
                );


        // =====================================================
        // CANCEL UNFINISHED ITEMS
        // =====================================================
        //
        // READY
        // SERVED
        //       ↓
        // remain unchanged
        //
        // ORDER_PLACED
        // PREPARING
        //       ↓
        // CANCELLED
        //
        // =====================================================

        for (
                OrderItem item : orderItems
        ) {

            OrderItemStatus status =
                    item.getStatus();


            if (
                    status == OrderItemStatus.ORDER_PLACED
                            ||
                            status == OrderItemStatus.PREPARING
            ) {

                item.setStatus(
                        OrderItemStatus.CANCELLED
                );


                orderItemRepository.save(
                        item
                );
            }
        }


        // =====================================================
        // MARK ORDER AS PAID
        // =====================================================

        order.setStatus(
                OrderStatus.PAID
        );


        // =====================================================
        // SAVE ORDER
        // =====================================================

        order =
                orderRepository.save(
                        order
                );


        // =====================================================
        // CLEAR TABLE CART
        // =====================================================
        //
        // Once payment is completed, the table cart must be
        // completely cleared.
        //
        // =====================================================

        if (
                order.getTableNumber() != null
        ) {

            cartRepository.deleteByTableNumber(
                    order.getTableNumber()
            );
        }


        // =====================================================
        // RETURN PAYMENT RESPONSE
        // =====================================================

        return convertToResponse(
                payment
        );
    }


    // =========================================================
    // GET PAYMENT BY ORDER ID
    // =========================================================

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(
            Long orderId
    ) {

        // =====================================================
        // FIND ORDER
        // =====================================================

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );


        // =====================================================
        // FIND PAYMENT
        // =====================================================

        Payment payment =
                paymentRepository
                        .findByOrder(
                                order
                        )
                        .orElseThrow(
                                () -> new PaymentNotFoundException(
                                        "Payment Not Found"
                                )
                        );


        // =====================================================
        // RETURN PAYMENT RESPONSE
        // =====================================================

        return convertToResponse(
                payment
        );
    }


    // =========================================================
    // CONVERT PAYMENT ENTITY → PAYMENT RESPONSE
    // =========================================================

    private PaymentResponse convertToResponse(
            Payment payment
    ) {

        return new PaymentResponse(

                payment.getId(),

                payment.getOrder().getId(),

                payment.getAmount(),

                payment.getPaymentMethod(),

                payment.getPaymentStatus(),

                payment.getPaymentTime()
        );
    }
}