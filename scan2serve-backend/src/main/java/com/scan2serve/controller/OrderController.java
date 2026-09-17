package com.scan2serve.controller;


import com.scan2serve.dto.BillResponse;
import com.scan2serve.dto.KitchenOrderResponse;
import com.scan2serve.dto.OrderItemStatusRequest;
import com.scan2serve.dto.OrderRequest;
import com.scan2serve.dto.OrderStatusRequest;
import com.scan2serve.dto.PaymentRequest;
import com.scan2serve.dto.PaymentResponse;

import com.scan2serve.entity.Order;
import com.scan2serve.entity.OrderItem;

import com.scan2serve.enums.OrderStatus;

import com.scan2serve.response.ApiResponse;

import com.scan2serve.service.KitchenService;
import com.scan2serve.service.OrderService;
import com.scan2serve.service.PaymentService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;


@RestController
public class OrderController {


    // =========================================================
    // SERVICES
    // =========================================================

    @Autowired
    private OrderService orderService;


    @Autowired
    private PaymentService paymentService;


    @Autowired
    private KitchenService kitchenService;



    // =========================================================
    // CUSTOMER APIs
    // =========================================================



    // =========================================================
    // CUSTOMER - PLACE ORDER
    // =========================================================

    @PostMapping("/customer/order")
    public ApiResponse<Order> placeOrder(
            @Valid @RequestBody OrderRequest request
    ) {

        Order order =
                orderService.placeOrder(
                        request
                );


        return new ApiResponse<>(
                true,
                "Order Placed Successfully",
                order
        );
    }



    // =========================================================
    // CUSTOMER - BILL
    // =========================================================

    @GetMapping("/customer/bill/{orderId}")
    public ApiResponse<BillResponse> getBill(
            @PathVariable Long orderId
    ) {

        BillResponse bill =
                orderService.generateBill(
                        orderId
                );


        return new ApiResponse<>(
                true,
                "Bill Generated Successfully",
                bill
        );
    }



    // =========================================================
    // ADMIN APIs
    // =========================================================



    // =========================================================
    // ADMIN - GET ALL ORDERS
    // =========================================================

    @GetMapping("/admin/orders")
    public ApiResponse<List<Order>> getAllOrders() {

        return new ApiResponse<>(
                true,
                "Orders Fetched Successfully",
                orderService.getAllOrders()
        );
    }



    // =========================================================
    // ADMIN - GET ORDER BY ID
    // =========================================================

    @GetMapping("/admin/orders/{id}")
    public ApiResponse<Order> getOrderById(
            @PathVariable Long id
    ) {

        return new ApiResponse<>(
                true,
                "Order Found",
                orderService.getOrderById(
                        id
                )
        );
    }



    // =========================================================
    // ADMIN - UPDATE ORDER STATUS
    // =========================================================

    @PutMapping("/admin/orders/{id}/status")
    public ApiResponse<Order> updateStatus(
            @PathVariable Long id,
            @RequestBody OrderStatusRequest request
    ) {

        Order order =
                orderService.updateStatus(
                        id,
                        request.getStatus()
                );


        return new ApiResponse<>(
                true,
                "Order Status Updated Successfully",
                order
        );
    }



    // =========================================================
    // ADMIN - GET ORDERS BY STATUS
    // =========================================================

    @GetMapping("/admin/orders/status/{status}")
    public ApiResponse<List<Order>> getOrdersByStatus(
            @PathVariable OrderStatus status
    ) {

        return new ApiResponse<>(
                true,
                "Orders Fetched Successfully",
                orderService.getOrdersByStatus(
                        status
                )
        );
    }



    // =========================================================
    // KITCHEN APIs
    // =========================================================



    // =========================================================
    // KITCHEN - GET ACTIVE ORDERS
    // =========================================================
    //
    // ADMIN + KITCHEN roles only.
    //
    // SecurityConfig controls access to /kitchen/**.
    //
    // =========================================================

    @GetMapping("/kitchen/orders")
    public ApiResponse<List<KitchenOrderResponse>>
    getKitchenOrders() {

        return new ApiResponse<>(
                true,
                "Kitchen Orders Fetched Successfully",
                kitchenService.getKitchenOrders()
        );
    }



    // =========================================================
    // KITCHEN - UPDATE INDIVIDUAL ITEM STATUS
    // =========================================================

    @PutMapping(
            "/kitchen/order-items/{itemId}/status"
    )
    public ApiResponse<OrderItem> updateItemStatus(
            @PathVariable Long itemId,
            @RequestBody OrderItemStatusRequest request
    ) {

        OrderItem item =
                orderService.updateItemStatus(
                        itemId,
                        request.getStatus()
                );


        return new ApiResponse<>(
                true,
                "Order Item Status Updated Successfully",
                item
        );
    }



    // =========================================================
    // KITCHEN - CLOSE ORDER
    // =========================================================
    //
    // IMPORTANT:
    //
    // Closing the Kitchen order does NOT change:
    //
    // PAID -> CLOSED
    //
    // Instead KitchenService sets:
    //
    // kitchenClosed = true
    //
    // The order remains PAID in the database.
    //
    // It simply disappears from the Kitchen Dashboard.
    //
    // =========================================================

    @PutMapping(
            "/kitchen/orders/{orderId}/close"
    )
    public ApiResponse<Order> closeKitchenOrder(
            @PathVariable Long orderId
    ) {

        Order order =
                kitchenService.closeKitchenOrder(
                        orderId
                );


        return new ApiResponse<>(
                true,
                "Kitchen Order Closed Successfully",
                order
        );
    }



    // =========================================================
    // BILL DESK APIs
    // =========================================================



    // =========================================================
    // BILL DESK - GET ACTIVE ORDERS
    // =========================================================

    @GetMapping("/bill-desk/orders")
    public ApiResponse<List<Order>> getBillDeskOrders() {

        return new ApiResponse<>(
                true,
                "Active Orders Fetched Successfully",
                orderService.getBillDeskOrders()
        );
    }



    // =========================================================
    // BILL DESK - GET BILL
    // =========================================================

    @GetMapping(
            "/bill-desk/orders/{orderId}/bill"
    )
    public ApiResponse<BillResponse> getBillDeskBill(
            @PathVariable Long orderId
    ) {

        BillResponse bill =
                orderService.generateBillForBillDesk(
                        orderId
                );


        return new ApiResponse<>(
                true,
                "Bill Found",
                bill
        );
    }



    // =========================================================
    // BILL DESK - GET BILL BY ORDER ID
    // =========================================================

    @GetMapping(
            "/bill-desk/orders/{orderId}"
    )
    public ApiResponse<BillResponse> getBillDeskBillByOrderId(
            @PathVariable Long orderId
    ) {

        BillResponse bill =
                orderService.generateBillForBillDesk(
                        orderId
                );


        return new ApiResponse<>(
                true,
                "Bill Fetched Successfully",
                bill
        );
    }



    // =========================================================
    // BILL DESK - SEARCH OLD BILLS
    // =========================================================
    //
    // Supported filters:
    //
    // /bill-desk/old-bills
    //
    // /bill-desk/old-bills?orderId=10
    //
    // /bill-desk/old-bills?tableNumber=5
    //
    // /bill-desk/old-bills?date=2026-09-11
    //
    // /bill-desk/old-bills?orderId=10&tableNumber=5&date=2026-09-11
    //
    // =========================================================

    @GetMapping(
            "/bill-desk/old-bills"
    )
    public ApiResponse<List<BillResponse>> searchOldBills(

            @RequestParam(
                    required = false
            )
            Long orderId,

            @RequestParam(
                    required = false
            )
            Integer tableNumber,

            @RequestParam(
                    required = false
            )
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date

    ) {

        // =====================================================
        // SEARCH ORDERS
        // =====================================================

        List<Order> orders =
                orderService.searchOldBills(
                        orderId,
                        tableNumber,
                        date
                );


        // =====================================================
        // CONVERT ORDERS TO BILL RESPONSES
        //
        // BillResponse is used here because it contains:
        //
        // - orderTime
        // - paymentTime
        // - paymentMethod
        // - customerName
        // - customerPhone
        // - subtotal
        // - GST
        // - grandTotal
        //
        // Payment time and payment method are read from the
        // persistent Payment entity inside buildBill().
        //
        // =====================================================

        List<BillResponse> oldBills =
                orders.stream()
                        .map(
                                order ->
                                        orderService
                                                .generateBillForBillDesk(
                                                        order.getId()
                                                )
                        )
                        .toList();


        // =====================================================
        // NO RESULTS
        // =====================================================

        if (
                oldBills.isEmpty()
        ) {

            String message;


            // -------------------------------------------------
            // ORDER + TABLE + DATE
            // -------------------------------------------------

            if (
                    orderId != null
                            &&
                            tableNumber != null
                            &&
                            date != null
            ) {

                message =
                        "No bill found for Order #"
                                + orderId
                                + ", Table "
                                + tableNumber
                                + " on "
                                + date;


                // -------------------------------------------------
                // ORDER + TABLE
                // -------------------------------------------------

            } else if (
                    orderId != null
                            &&
                            tableNumber != null
            ) {

                message =
                        "No bill found for Order #"
                                + orderId
                                + " on Table "
                                + tableNumber;


                // -------------------------------------------------
                // ORDER + DATE
                // -------------------------------------------------

            } else if (
                    orderId != null
                            &&
                            date != null
            ) {

                message =
                        "No bill found for Order #"
                                + orderId
                                + " on "
                                + date;


                // -------------------------------------------------
                // TABLE + DATE
                // -------------------------------------------------

            } else if (
                    tableNumber != null
                            &&
                            date != null
            ) {

                message =
                        "No bills found for Table "
                                + tableNumber
                                + " on "
                                + date;


                // -------------------------------------------------
                // ORDER ONLY
                // -------------------------------------------------

            } else if (
                    orderId != null
            ) {

                message =
                        "No bill found for Order #"
                                + orderId;


                // -------------------------------------------------
                // TABLE ONLY
                // -------------------------------------------------

            } else if (
                    tableNumber != null
            ) {

                message =
                        "No bills found for Table "
                                + tableNumber;


                // -------------------------------------------------
                // DATE ONLY
                // -------------------------------------------------

            } else if (
                    date != null
            ) {

                message =
                        "No bills found for "
                                + date;


                // -------------------------------------------------
                // NO FILTERS
                // -------------------------------------------------

            } else {

                message =
                        "No old bills found";
            }


            return new ApiResponse<>(
                    true,
                    message,
                    oldBills
            );
        }


        // =====================================================
        // RESULTS FOUND
        // =====================================================

        return new ApiResponse<>(
                true,
                "Old Bills Fetched Successfully",
                oldBills
        );
    }



    // =========================================================
    // BILL DESK - CANCEL COMPLETE BILL
    // =========================================================
    //
    // Cancels the complete unpaid bill/order.
    //
    // The actual cancellation logic is implemented inside
    // OrderService.cancelCompleteBill().
    //
    // Endpoint:
    //
    // PUT /bill-desk/orders/{orderId}/cancel
    //
    // =========================================================

    @PutMapping(
            "/bill-desk/orders/{orderId}/cancel"
    )
    public ApiResponse<Order> cancelCompleteBill(
            @PathVariable Long orderId
    ) {

        Order order =
                orderService.cancelCompleteBill(
                        orderId
                );


        return new ApiResponse<>(
                true,
                "Complete Bill Cancelled Successfully",
                order
        );
    }



    // =========================================================
    // BILL DESK - CANCEL INDIVIDUAL ITEM
    // =========================================================
    //
    // Cancels only one item from the selected unpaid bill.
    //
    // Endpoint:
    //
    // PUT /bill-desk/orders/{orderId}/items/{itemId}/cancel
    //
    // =========================================================

    @PutMapping(
            "/bill-desk/orders/{orderId}/items/{itemId}/cancel"
    )
    public ApiResponse<OrderItem> cancelBillDeskItem(

            @PathVariable Long orderId,

            @PathVariable Long itemId

    ) {

        OrderItem cancelledItem =
                orderService.cancelBillDeskItem(
                        orderId,
                        itemId
                );


        return new ApiResponse<>(
                true,
                "Bill Item Cancelled Successfully",
                cancelledItem
        );
    }



    // =========================================================
    // BILL DESK - PAYMENT
    // =========================================================

    @PostMapping(
            "/bill-desk/orders/{orderId}/payment"
    )
    public ApiResponse<PaymentResponse> processPayment(

            @PathVariable Long orderId,

            @RequestBody PaymentRequest request

    ) {

        PaymentResponse payment =
                paymentService.processPayment(
                        orderId,
                        request.getPaymentMethod()
                );


        return new ApiResponse<>(
                true,
                "Payment Completed Successfully",
                payment
        );
    }

}