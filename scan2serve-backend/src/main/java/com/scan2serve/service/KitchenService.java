package com.scan2serve.service;


import com.scan2serve.dto.KitchenOrderItemResponse;
import com.scan2serve.dto.KitchenOrderResponse;
import com.scan2serve.entity.Order;
import com.scan2serve.entity.OrderItem;
import com.scan2serve.enums.OrderItemStatus;
import com.scan2serve.enums.OrderStatus;
import com.scan2serve.repository.OrderItemRepository;
import com.scan2serve.repository.OrderRepository;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.ArrayList;
import java.util.List;


@Service
public class KitchenService {


    private final OrderRepository orderRepository;

    private final OrderItemRepository orderItemRepository;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public KitchenService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {

        this.orderRepository =
                orderRepository;

        this.orderItemRepository =
                orderItemRepository;
    }


    // =========================================================
    // KITCHEN - GET ACTIVE ORDERS
    // =========================================================
    //
    // Kitchen Dashboard shows:
    //
    // 1. PENDING orders
    // 2. PREPARING orders
    // 3. READY orders
    //
    // PLUS:
    //
    // 4. PAID orders that contain CANCELLED items
    //
    // A PAID order is intentionally kept visible when payment
    // caused unfinished items to become CANCELLED.
    //
    // Once Kitchen closes that order:
    //
    // kitchenClosed = true
    //
    // and it disappears from this list.
    //
    // =========================================================

    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getKitchenOrders() {

        List<OrderStatus> kitchenStatuses =
                List.of(
                        OrderStatus.PENDING,
                        OrderStatus.PREPARING,
                        OrderStatus.READY,
                        OrderStatus.PAID
                );


        List<Order> orders =
                orderRepository
                        .findByStatusInAndKitchenClosedFalseOrderByIdAsc(
                                kitchenStatuses
                        );


        List<KitchenOrderResponse> response =
                new ArrayList<>();


        for (
                Order order :
                orders
        ) {

            List<OrderItem> orderItems =
                    orderItemRepository.findByOrder(
                            order
                    );


            List<KitchenOrderItemResponse> items =
                    new ArrayList<>();


            for (
                    OrderItem item :
                    orderItems
            ) {

                KitchenOrderItemResponse itemResponse =
                        new KitchenOrderItemResponse(
                                item.getId(),
                                item.getMenu().getId(),
                                item.getMenu().getName(),
                                item.getQuantity(),
                                item.getPrice(),
                                item.getStatus()
                        );


                items.add(
                        itemResponse
                );
            }


            KitchenOrderResponse orderResponse =
                    new KitchenOrderResponse(
                            order.getId(),
                            order.getTableNumber(),
                            order.getStatus(),
                            order.getOrderTime(),
                            order.getGrandTotal(),
                            items
                    );


            response.add(
                    orderResponse
            );
        }


        return response;
    }


    // =========================================================
    // KITCHEN - CLOSE ORDER
    // =========================================================
    //
    // IMPORTANT:
    //
    // Closing does NOT change:
    //
    // PAID
    //
    // to:
    //
    // CLOSED
    //
    // Instead:
    //
    // order.status        = PAID
    // order.kitchenClosed = true
    //
    // The order remains permanently stored in the database.
    //
    // It simply disappears from the active Kitchen Dashboard.
    //
    // =========================================================

    @Transactional
    public Order closeKitchenOrder(
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
                                () ->
                                        new RuntimeException(
                                                "Order Not Found"
                                        )
                        );


        // =====================================================
        // ALREADY CLOSED
        // =====================================================

        if (
                order.isKitchenClosed()
        ) {

            throw new IllegalStateException(
                    "Order is already closed in Kitchen"
            );
        }


        // =====================================================
        // ONLY PAID ORDERS CAN BE CLOSED
        // =====================================================
        //
        // A normal active order must not be accidentally removed
        // from Kitchen while food is still being prepared.
        //
        // Payment is therefore the point at which Kitchen can
        // review the final/cancelled state and close the order.
        //
        // =====================================================

        if (
                order.getStatus()
                        !=
                        OrderStatus.PAID
        ) {

            throw new IllegalStateException(
                    "Only paid orders can be closed from Kitchen"
            );
        }


        // =====================================================
        // GET ITEMS
        // =====================================================

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder(
                        order
                );


        if (
                orderItems.isEmpty()
        ) {

            throw new IllegalStateException(
                    "Cannot close an order without items"
            );
        }


        // =====================================================
        // SAFETY CHECK
        // =====================================================
        //
        // There must not be an unfinished item remaining.
        //
        // PaymentService should already have converted:
        //
        // ORDER_PLACED -> CANCELLED
        // PREPARING    -> CANCELLED
        //
        // But this validation protects the Kitchen API as well.
        //
        // =====================================================

        boolean hasUnfinishedItem =
                orderItems.stream()
                        .anyMatch(
                                item -> {

                                    OrderItemStatus status =
                                            item.getStatus();

                                    return status
                                            ==
                                            OrderItemStatus.ORDER_PLACED

                                            ||

                                            status
                                                    ==
                                                    OrderItemStatus.PREPARING;
                                }
                        );


        if (
                hasUnfinishedItem
        ) {

            throw new IllegalStateException(
                    "Order cannot be closed while unfinished items remain"
            );
        }


        // =====================================================
        // CLOSE ONLY KITCHEN VISIBILITY
        // =====================================================

        order.setKitchenClosed(
                true
        );


        // =====================================================
        // SAVE
        // =====================================================

        return orderRepository.save(
                order
        );
    }
}