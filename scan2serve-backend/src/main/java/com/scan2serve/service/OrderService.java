package com.scan2serve.service;

import com.scan2serve.dto.BillItemResponse;
import com.scan2serve.dto.BillResponse;
import com.scan2serve.dto.KitchenOrderItemResponse;
import com.scan2serve.dto.KitchenOrderResponse;
import com.scan2serve.dto.OrderRequest;

import com.scan2serve.entity.Cart;
import com.scan2serve.entity.Order;
import com.scan2serve.entity.OrderItem;

import com.scan2serve.enums.OrderItemStatus;
import com.scan2serve.enums.OrderStatus;

import com.scan2serve.repository.CartRepository;
import com.scan2serve.repository.OrderItemRepository;
import com.scan2serve.repository.OrderRepository;
import com.scan2serve.repository.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RestaurantSettingsService restaurantSettingsService;


    // =========================================================
    // CUSTOMER - PLACE ORDER
    // =========================================================

    public Order placeOrder(OrderRequest request) {

        if (request == null) {
            throw new RuntimeException(
                    "Order Request is required"
            );
        }

        Integer tableNumber =
                request.getTableNumber();

        if (tableNumber == null) {
            throw new RuntimeException(
                    "Table Number is required"
            );
        }

        String customerName =
                request.getCustomerName();

        if (
                customerName == null
                        ||
                        customerName.trim().isEmpty()
        ) {
            throw new RuntimeException(
                    "Customer Name is required"
            );
        }

        customerName =
                customerName.trim();

        if (customerName.length() < 2) {
            throw new RuntimeException(
                    "Customer Name must be at least 2 characters"
            );
        }

        if (customerName.length() > 100) {
            throw new RuntimeException(
                    "Customer Name cannot exceed 100 characters"
            );
        }

        String customerPhone =
                request.getCustomerPhone();

        if (
                customerPhone == null
                        ||
                        customerPhone.trim().isEmpty()
        ) {
            throw new RuntimeException(
                    "Customer Phone is required"
            );
        }

        customerPhone =
                customerPhone.trim();

        if (
                !customerPhone.matches(
                        "^[6-9][0-9]{9}$"
                )
        ) {
            throw new RuntimeException(
                    "Customer Phone must be a valid 10-digit mobile number"
            );
        }


        // =====================================================
        // GET CART
        // =====================================================

        List<Cart> cartItems =
                cartRepository.findByTableNumber(
                        tableNumber
                );

        if (cartItems.isEmpty()) {
            throw new RuntimeException(
                    "Cart is Empty"
            );
        }


        // =====================================================
        // CLOSED ORDER STATUSES
        // =====================================================

        List<OrderStatus> closedStatuses =
                List.of(
                        OrderStatus.PAID,
                        OrderStatus.CANCELLED
                );


        // =====================================================
        // FIND EXISTING ACTIVE ORDER
        // =====================================================

        Order order =
                orderRepository
                        .findFirstByTableNumberAndStatusNotInOrderByIdDesc(
                                tableNumber,
                                closedStatuses
                        )
                        .orElse(null);


        // =====================================================
        // CREATE NEW ORDER
        // =====================================================

        if (order == null) {

            order =
                    new Order();

            order.setTableNumber(
                    tableNumber
            );

            order.setCustomerName(
                    customerName
            );

            order.setCustomerPhone(
                    customerPhone
            );

            order.setStatus(
                    OrderStatus.PENDING
            );

            order.setOrderTime(
                    LocalDateTime.now()
            );

            order.setSubtotal(
                    0.0
            );

            /*
             * IMPORTANT:
             *
             * GST is captured when a NEW order is created.
             *
             * Therefore changing GST from Admin Dashboard
             * affects NEW orders without changing historical
             * orders.
             */
            order.setGstPercentage(
                    restaurantSettingsService
                            .getGstPercentage()
            );

            order.setGst(
                    0.0
            );

            order.setGrandTotal(
                    0.0
            );

            order =
                    orderRepository.save(
                            order
                    );

        } else {

            // =================================================
            // EXISTING ACTIVE ORDER
            // =================================================

            boolean customerInformationUpdated =
                    false;

            if (
                    order.getCustomerName() == null
                            ||
                            order.getCustomerName()
                                    .trim()
                                    .isEmpty()
            ) {

                order.setCustomerName(
                        customerName
                );

                customerInformationUpdated =
                        true;
            }

            if (
                    order.getCustomerPhone() == null
                            ||
                            order.getCustomerPhone()
                                    .trim()
                                    .isEmpty()
            ) {

                order.setCustomerPhone(
                        customerPhone
                );

                customerInformationUpdated =
                        true;
            }

            if (customerInformationUpdated) {

                order =
                        orderRepository.save(
                                order
                        );
            }
        }


        // =====================================================
        // ADD CART ITEMS TO ORDER
        // =====================================================

        for (Cart cart : cartItems) {

            OrderItem item =
                    new OrderItem();

            item.setOrder(
                    order
            );

            item.setMenu(
                    cart.getMenu()
            );

            item.setQuantity(
                    cart.getQuantity()
            );

            item.setStatus(
                    OrderItemStatus.ORDER_PLACED
            );

            double price =
                    cart.getMenu().getPrice()
                            *
                            cart.getQuantity();

            item.setPrice(
                    price
            );

            orderItemRepository.save(
                    item
            );
        }


        // =====================================================
        // RECALCULATE ORDER TOTALS
        // =====================================================

        recalculateOrderTotals(
                order
        );


        // =====================================================
        // SYNCHRONIZE ORDER STATUS
        // =====================================================

        synchronizeOrderStatus(
                order
        );


        // =====================================================
        // CLEAR CART
        // =====================================================

        cartRepository.deleteByTableNumber(
                tableNumber
        );

        return order;
    }


    // =========================================================
    // CUSTOMER - GET CURRENT ACTIVE ORDER
    // =========================================================

    public Order getCurrentOrder(
            Integer tableNumber
    ) {

        if (tableNumber == null) {
            throw new RuntimeException(
                    "Table Number is required"
            );
        }

        List<OrderStatus> closedStatuses =
                List.of(
                        OrderStatus.PAID,
                        OrderStatus.CANCELLED
                );

        return orderRepository
                .findFirstByTableNumberAndStatusNotInOrderByIdDesc(
                        tableNumber,
                        closedStatuses
                )
                .orElse(null);
    }


    // =========================================================
    // CUSTOMER - GET ORDER STATUS
    // =========================================================

    public OrderStatus getOrderStatus(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        return order.getStatus();
    }


    // =========================================================
    // ADMIN - GET ALL ORDERS
    // =========================================================

    public List<Order> getAllOrders() {

        return orderRepository.findAll();
    }


    // =========================================================
    // ADMIN - GET ORDER BY ID
    // =========================================================

    public Order getOrderById(
            Long id
    ) {

        return orderRepository.findById(
                        id
                )
                .orElseThrow(
                        () -> new RuntimeException(
                                "Order Not Found"
                        )
                );
    }


    // =========================================================
    // ADMIN - UPDATE ORDER STATUS
    // =========================================================

    public Order updateStatus(
            Long id,
            OrderStatus status
    ) {

        Order order =
                orderRepository.findById(
                                id
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        if (status == null) {

            throw new IllegalArgumentException(
                    "Order status cannot be null"
            );
        }

        order.setStatus(
                status
        );

        return orderRepository.save(
                order
        );
    }


    // =========================================================
    // ADMIN - GET ORDERS BY STATUS
    // =========================================================

    public List<Order> getOrdersByStatus(
            OrderStatus status
    ) {

        return orderRepository.findByStatus(
                status
        );
    }


    // =========================================================
    // KITCHEN - GET ACTIVE ORDERS
    // =========================================================

    public List<KitchenOrderResponse> getKitchenOrders() {

        List<OrderStatus> kitchenStatuses =
                List.of(
                        OrderStatus.PENDING,
                        OrderStatus.PREPARING,
                        OrderStatus.READY,
                        OrderStatus.PAID
                );

        /*
         * Your current OrderRepository provides this method.
         */
        List<Order> orders =
                orderRepository
                        .findByStatusInAndKitchenClosedFalseOrderByIdAsc(
                                kitchenStatuses
                        );

        List<KitchenOrderResponse> response =
                new ArrayList<>();

        for (Order order : orders) {

            List<OrderItem> orderItems =
                    orderItemRepository.findByOrder(
                            order
                    );

            List<KitchenOrderItemResponse> items =
                    new ArrayList<>();

            for (OrderItem item : orderItems) {

                if (item == null) {
                    continue;
                }

                if (item.getMenu() == null) {
                    continue;
                }

                /*
                 * IMPORTANT:
                 *
                 * KitchenOrderItemResponse constructor in the
                 * current project is:
                 *
                 * Long itemId
                 * Long menuId
                 * String itemName
                 * Integer quantity
                 * Double price
                 * OrderItemStatus status
                 */
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


            /*
             * IMPORTANT:
             *
             * KitchenOrderResponse uses:
             *
             * orderId
             * tableNumber
             * orderStatus
             * orderTime
             * totalAmount
             * items
             *
             * It does NOT contain customerName,
             * customerPhone or a generic setStatus().
             */
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
    // KITCHEN - GET ITEMS OF ONE ORDER
    // =========================================================

    public List<KitchenOrderItemResponse> getOrderItems(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder(
                        order
                );

        List<KitchenOrderItemResponse> response =
                new ArrayList<>();

        for (OrderItem item : orderItems) {

            if (item == null) {
                continue;
            }

            if (item.getMenu() == null) {
                continue;
            }

            KitchenOrderItemResponse itemResponse =
                    new KitchenOrderItemResponse(
                            item.getId(),
                            item.getMenu().getId(),
                            item.getMenu().getName(),
                            item.getQuantity(),
                            item.getPrice(),
                            item.getStatus()
                    );

            response.add(
                    itemResponse
            );
        }

        return response;
    }


    // =========================================================
    // KITCHEN - UPDATE ITEM STATUS
    // =========================================================
    //
    // ORDER_PLACED -> PREPARING
    // PREPARING    -> READY
    // READY        -> SERVED
    //
    // =========================================================

    public OrderItem updateItemStatus(
            Long itemId,
            OrderItemStatus newStatus
    ) {

        OrderItem currentItem =
                orderItemRepository.findById(
                                itemId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Item Not Found"
                                )
                        );

        validateStatusTransition(
                currentItem.getStatus(),
                newStatus
        );

        currentItem.setStatus(
                newStatus
        );

        currentItem =
                orderItemRepository.save(
                        currentItem
                );

        Order order =
                currentItem.getOrder();

        if (order != null) {

            recalculateOrderTotals(
                    order
            );

            synchronizeOrderStatus(
                    order
            );
        }

        return currentItem;
    }


    // =========================================================
    // KITCHEN - UPDATE ITEM BY ORDER + ITEM
    // =========================================================

    public OrderItem updateItemStatus(
            Long orderId,
            Long itemId,
            OrderItemStatus newStatus
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        OrderItem item =
                orderItemRepository
                        .findByIdAndOrder(
                                itemId,
                                order
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Item Not Found for this Order"
                                )
                        );

        validateStatusTransition(
                item.getStatus(),
                newStatus
        );

        item.setStatus(
                newStatus
        );

        item =
                orderItemRepository.save(
                        item
                );

        recalculateOrderTotals(
                order
        );

        synchronizeOrderStatus(
                order
        );

        return item;
    }


    // =========================================================
    // VALIDATE STATUS TRANSITION
    // =========================================================

    private void validateStatusTransition(
            OrderItemStatus currentStatus,
            OrderItemStatus newStatus
    ) {

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New item status cannot be null"
            );
        }

        if (currentStatus == null) {

            if (
                    newStatus
                            !=
                            OrderItemStatus.ORDER_PLACED
            ) {

                throw new IllegalStateException(
                        "Invalid initial order item status"
                );
            }

            return;
        }

        if (
                currentStatus
                        ==
                        OrderItemStatus.CANCELLED
        ) {

            throw new IllegalStateException(
                    "Cancelled item cannot be updated"
            );
        }

        if (
                currentStatus
                        ==
                        OrderItemStatus.SERVED
        ) {

            throw new IllegalStateException(
                    "SERVED item cannot be updated"
            );
        }

        if (
                currentStatus
                        ==
                        OrderItemStatus.ORDER_PLACED
                        &&
                        newStatus
                                ==
                                OrderItemStatus.PREPARING
        ) {
            return;
        }

        if (
                currentStatus
                        ==
                        OrderItemStatus.PREPARING
                        &&
                        newStatus
                                ==
                                OrderItemStatus.READY
        ) {
            return;
        }

        if (
                currentStatus
                        ==
                        OrderItemStatus.READY
                        &&
                        newStatus
                                ==
                                OrderItemStatus.SERVED
        ) {
            return;
        }

        throw new IllegalStateException(
                "Invalid status transition: "
                        +
                        currentStatus
                        +
                        " -> "
                        +
                        newStatus
        );
    }


    // =========================================================
    // SYNCHRONIZE ORDER STATUS
    // =========================================================

    private void synchronizeOrderStatus(
            Order order
    ) {

        if (order == null) {
            return;
        }

        if (
                order.getStatus()
                        ==
                        OrderStatus.PAID
                        ||
                        order.getStatus()
                                ==
                                OrderStatus.CANCELLED
        ) {
            return;
        }

        List<OrderItem> items =
                orderItemRepository.findByOrder(
                        order
                );

        if (items.isEmpty()) {

            order.setStatus(
                    OrderStatus.PENDING
            );

            orderRepository.save(
                    order
            );

            return;
        }

        boolean hasOrderPlaced =
                false;

        boolean hasPreparing =
                false;

        boolean hasReady =
                false;

        boolean hasServed =
                false;

        boolean hasActiveItem =
                false;


        for (OrderItem item : items) {

            if (item == null) {
                continue;
            }

            OrderItemStatus status =
                    item.getStatus();

            if (
                    status
                            ==
                            OrderItemStatus.CANCELLED
            ) {
                continue;
            }

            hasActiveItem =
                    true;

            if (status == null) {

                hasOrderPlaced =
                        true;

            } else if (
                    status
                            ==
                            OrderItemStatus.ORDER_PLACED
            ) {

                hasOrderPlaced =
                        true;

            } else if (
                    status
                            ==
                            OrderItemStatus.PREPARING
            ) {

                hasPreparing =
                        true;

            } else if (
                    status
                            ==
                            OrderItemStatus.READY
            ) {

                hasReady =
                        true;

            } else if (
                    status
                            ==
                            OrderItemStatus.SERVED
            ) {

                hasServed =
                        true;
            }
        }


        if (!hasActiveItem) {

            order.setStatus(
                    OrderStatus.CANCELLED
            );

        } else if (hasOrderPlaced) {

            order.setStatus(
                    OrderStatus.PENDING
            );

        } else if (hasPreparing) {

            order.setStatus(
                    OrderStatus.PREPARING
            );

        } else if (hasReady) {

            order.setStatus(
                    OrderStatus.READY
            );

        } else if (hasServed) {

            order.setStatus(
                    OrderStatus.SERVED
            );
        }

        orderRepository.save(
                order
        );
    }


    // =========================================================
    // BILL DESK - GET ACTIVE ORDERS
    // =========================================================

    public List<Order> getBillDeskOrders() {

        List<OrderStatus> closedStatuses =
                List.of(
                        OrderStatus.PAID,
                        OrderStatus.CANCELLED
                );

        return orderRepository.findByStatusNotIn(
                closedStatuses
        );
    }


    // =========================================================
    // BILL DESK - SEARCH OLD BILLS
    // =========================================================
    //
    // Your current OrderRepository.searchOldBills()
    // requires:
    //
    // status
    // orderId
    // tableNumber
    // startDateTime
    // endDateTime
    //
    // Therefore we call it separately for PAID and
    // CANCELLED orders and combine the results.
    //
    // =========================================================

    public List<Order> searchOldBills(
            Long orderId,
            Integer tableNumber,
            LocalDate date
    ) {

        LocalDateTime startDateTime =
                null;

        LocalDateTime endDateTime =
                null;

        if (date != null) {

            startDateTime =
                    date.atStartOfDay();

            endDateTime =
                    date.plusDays(1)
                            .atStartOfDay();
        }


        List<Order> results =
                new ArrayList<>();


        // =====================================================
        // PAID BILLS
        // =====================================================

        List<Order> paidOrders =
                orderRepository.searchOldBills(
                        List.of(OrderStatus.PAID),
                        orderId,
                        tableNumber,
                        startDateTime,
                        endDateTime
                );

        results.addAll(
                paidOrders
        );


        // =====================================================
        // CANCELLED BILLS
        // =====================================================

        List<Order> cancelledOrders =
                orderRepository.searchOldBills(
                        List.of(OrderStatus.CANCELLED),
                        orderId,
                        tableNumber,
                        startDateTime,
                        endDateTime
                );

        results.addAll(
                cancelledOrders
        );


        // =====================================================
        // SORT NEWEST FIRST
        // =====================================================

        results.sort(
                (a, b) -> {

                    if (
                            a.getOrderTime() == null
                                    &&
                                    b.getOrderTime() == null
                    ) {
                        return 0;
                    }

                    if (a.getOrderTime() == null) {
                        return 1;
                    }

                    if (b.getOrderTime() == null) {
                        return -1;
                    }

                    return b.getOrderTime()
                            .compareTo(
                                    a.getOrderTime()
                            );
                }
        );

        return results;
    }


    // =========================================================
    // BILL DESK - SEARCH BILL BY ORDER ID
    // =========================================================

    public Order searchBillByOrderId(
            Long orderId
    ) {

        if (orderId == null) {

            throw new IllegalArgumentException(
                    "Order ID is required"
            );
        }

        return orderRepository
                .findById(
                        orderId
                )
                .filter(
                        order ->
                                order.getStatus()
                                        ==
                                        OrderStatus.PAID
                )
                .orElseThrow(
                        () -> new RuntimeException(
                                "Paid Bill Not Found for Order ID: "
                                        +
                                        orderId
                        )
                );
    }


    // =========================================================
    // BILL DESK - SEARCH BILLS BY TABLE NUMBER
    // =========================================================

    public List<Order> searchBillsByTableNumber(
            Integer tableNumber
    ) {

        if (tableNumber == null) {

            throw new IllegalArgumentException(
                    "Table Number is required"
            );
        }

        /*
         * Do not use findByTableNumberAndStatusIn()
         * because that method does not exist in the
         * current OrderRepository.
         */
        return orderRepository
                .findByStatus(
                        OrderStatus.PAID
                )
                .stream()
                .filter(
                        order ->
                                order.getTableNumber() != null
                                        &&
                                        order.getTableNumber()
                                                .equals(
                                                        tableNumber
                                                )
                )
                .toList();
    }


    // =========================================================
    // BILL DESK - SEARCH BILLS BY DATE
    // =========================================================

    public List<Order> searchBillsByDate(
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {

        if (
                startDateTime == null
                        ||
                        endDateTime == null
        ) {

            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }

        if (
                startDateTime.isAfter(
                        endDateTime
                )
        ) {

            throw new IllegalArgumentException(
                    "Start date cannot be after end date"
            );
        }

        return orderRepository
                .findByStatus(
                        OrderStatus.PAID
                )
                .stream()
                .filter(
                        order -> {

                            if (
                                    order.getOrderTime() == null
                            ) {
                                return false;
                            }

                            return
                                    !order.getOrderTime()
                                            .isBefore(
                                                    startDateTime
                                            )
                                            &&
                                            order.getOrderTime()
                                                    .isBefore(
                                                            endDateTime
                                                    );
                        }
                )
                .toList();
    }


    // =========================================================
    // BILL DESK - MARK ORDER AS PAID
    // =========================================================

    public Order markOrderAsPaid(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        if (
                order.getStatus()
                        ==
                        OrderStatus.PAID
        ) {

            throw new RuntimeException(
                    "Order is already PAID"
            );
        }

        if (
                order.getStatus()
                        ==
                        OrderStatus.CANCELLED
        ) {

            throw new RuntimeException(
                    "Cancelled order cannot be marked as PAID"
            );
        }


        // =====================================================
        // RECALCULATE BEFORE PAYMENT
        // =====================================================

        recalculateOrderTotals(
                order
        );


        if (
                order.getGrandTotal() == null
                        ||
                        order.getGrandTotal() <= 0
        ) {

            throw new IllegalStateException(
                    "Order has no READY or SERVED billable items"
            );
        }


        order.setStatus(
                OrderStatus.PAID
        );

        /*
         * Payment time is persisted by PaymentService
         * in the Payment entity.
         *
         * Do not use Order.paymentTime as the source
         * of truth here.
         */

        return orderRepository.save(
                order
        );
    }


    // =========================================================
    // CUSTOMER - GENERATE BILL
    // =========================================================

    public BillResponse generateBill(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        return buildBill(
                order
        );
    }


    // =========================================================
    // BILL DESK - GENERATE BILL
    // =========================================================

    public BillResponse generateBillForBillDesk(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );

        return buildBill(
                order
        );
    }


    // =========================================================
    // BUILD BILL
    // =========================================================
    //
    // ALL ORDER ITEMS ARE DISPLAYED.
    //
    // ONLY:
    //
    // READY
    // SERVED
    //
    // contribute to subtotal/GST/grand total.
    //
    // ORDER_PLACED -> NOT BILLABLE
    // PREPARING    -> NOT BILLABLE
    // READY        -> BILLABLE
    // SERVED       -> BILLABLE
    // CANCELLED    -> NOT BILLABLE
    //
    // =========================================================

    private BillResponse buildBill(
            Order order
    ) {

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder(
                        order
                );

        List<BillItemResponse> items =
                new ArrayList<>();

        double subtotal =
                0.0;


        // =====================================================
        // BUILD BILL ITEMS
        // =====================================================

        for (OrderItem item : orderItems) {

            if (item == null) {
                continue;
            }

            if (
                    item.getQuantity() == null
                            ||
                            item.getQuantity() <= 0
            ) {
                continue;
            }

            if (item.getPrice() == null) {
                continue;
            }

            if (item.getMenu() == null) {
                continue;
            }


            double unitPrice =
                    item.getPrice()
                            /
                            item.getQuantity();


            String itemStatus =
                    item.getStatus() == null
                            ?
                            OrderItemStatus.ORDER_PLACED.name()
                            :
                            item.getStatus().name();


            BillItemResponse billItem =
                    new BillItemResponse();

            billItem.setItemId(
                    item.getId()
            );

            billItem.setItemName(
                    item.getMenu().getName()
            );

            billItem.setQuantity(
                    item.getQuantity()
            );

            billItem.setUnitPrice(
                    roundMoney(
                            unitPrice
                    )
            );

            billItem.setTotalPrice(
                    roundMoney(
                            item.getPrice()
                    )
            );

            billItem.setStatus(
                    itemStatus
            );

            items.add(
                    billItem
            );


            // =================================================
            // ONLY READY + SERVED ARE BILLABLE
            // =================================================

            if (
                    item.getStatus()
                            ==
                            OrderItemStatus.READY
                            ||
                            item.getStatus()
                                    ==
                                    OrderItemStatus.SERVED
            ) {

                subtotal +=
                        item.getPrice();
            }
        }


        // =====================================================
        // GST PERCENTAGE
        // =====================================================

        double gstPercentage;

        if (
                order.getGstPercentage() != null
        ) {

            gstPercentage =
                    order.getGstPercentage();

        } else {

            /*
             * Older orders without a stored GST percentage
             * use the currently configured restaurant GST.
             */
            gstPercentage =
                    restaurantSettingsService
                            .getGstPercentage();
        }


        // =====================================================
        // GST
        // =====================================================

        double gst =
                subtotal
                        *
                        (
                                gstPercentage
                                        /
                                        100.0
                        );


        // =====================================================
        // GRAND TOTAL
        // =====================================================

        subtotal =
                roundMoney(
                        subtotal
                );

        gst =
                roundMoney(
                        gst
                );

        double grandTotal =
                roundMoney(
                        subtotal + gst
                );


        // =====================================================
        // SAVE TOTALS TO ORDER
        // =====================================================

        order.setSubtotal(
                subtotal
        );

        order.setGstPercentage(
                gstPercentage
        );

        order.setGst(
                gst
        );

        order.setGrandTotal(
                grandTotal
        );

        orderRepository.save(
                order
        );


        // =====================================================
        // CREATE BILL RESPONSE
        // =====================================================

        BillResponse bill =
                new BillResponse();

        bill.setOrderId(
                order.getId()
        );

        bill.setTableNumber(
                order.getTableNumber()
        );

        bill.setCustomerName(
                order.getCustomerName()
        );

        bill.setCustomerPhone(
                order.getCustomerPhone()
        );

        bill.setItems(
                items
        );

        bill.setSubtotal(
                subtotal
        );

        bill.setGstPercentage(
                gstPercentage
        );

        bill.setGst(
                gst
        );

        bill.setGrandTotal(
                grandTotal
        );

        bill.setOrderTime(
                order.getOrderTime()
        );


        // =====================================================
        // PAYMENT STATUS
        // =====================================================

        bill.setPaymentStatus(
                order.getStatus() != null
                        ?
                        order.getStatus().name()
                        :
                        null
        );


        // =====================================================
        // PAYMENT INFORMATION
        // =====================================================
        //
        // Payment is the persistent source of truth.
        //
        // =====================================================

        paymentRepository
                .findByOrder(
                        order
                )
                .ifPresent(
                        payment -> {

                            bill.setPaymentTime(
                                    payment.getPaymentTime()
                            );

                            if (
                                    payment.getPaymentMethod()
                                            !=
                                            null
                            ) {

                                bill.setPaymentMethod(
                                        payment
                                                .getPaymentMethod()
                                                .name()
                                );
                            }
                        }
                );

        return bill;
    }


    // =========================================================
    // BILL DESK - CANCEL INDIVIDUAL ITEM
    // =========================================================

    public OrderItem cancelBillDeskItem(
            Long orderId,
            Long itemId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );


        if (
                order.getStatus()
                        ==
                        OrderStatus.PAID
        ) {

            throw new IllegalStateException(
                    "Paid order cannot be cancelled"
            );
        }


        if (
                order.getStatus()
                        ==
                        OrderStatus.CANCELLED
        ) {

            throw new IllegalStateException(
                    "Order is already CANCELLED"
            );
        }


        OrderItem item =
                orderItemRepository
                        .findByIdAndOrder(
                                itemId,
                                order
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Item Not Found for this Order"
                                )
                        );


        OrderItemStatus currentStatus =
                item.getStatus();


        if (currentStatus == null) {

            throw new IllegalStateException(
                    "Order Item Status is not available"
            );
        }


        if (
                currentStatus
                        ==
                        OrderItemStatus.CANCELLED
        ) {

            throw new IllegalStateException(
                    "Order Item is already CANCELLED"
            );
        }


        if (
                currentStatus
                        ==
                        OrderItemStatus.SERVED
        ) {

            throw new IllegalStateException(
                    "SERVED item cannot be cancelled"
            );
        }


        if (
                currentStatus
                        !=
                        OrderItemStatus.ORDER_PLACED
                        &&
                        currentStatus
                                !=
                                OrderItemStatus.PREPARING
                        &&
                        currentStatus
                                !=
                                OrderItemStatus.READY
        ) {

            throw new IllegalStateException(
                    "Item cannot be cancelled from its current status: "
                            +
                            currentStatus
            );
        }


        // =====================================================
        // CANCEL ITEM
        // =====================================================

        item.setStatus(
                OrderItemStatus.CANCELLED
        );

        item =
                orderItemRepository.save(
                        item
                );


        // =====================================================
        // RECALCULATE BILL
        // =====================================================

        recalculateOrderTotals(
                order
        );


        // =====================================================
        // CHECK ACTIVE ITEMS
        // =====================================================

        List<OrderItem> remainingItems =
                orderItemRepository.findByOrder(
                        order
                );

        boolean hasActiveItem =
                false;

        for (OrderItem remainingItem :
                remainingItems) {

            if (
                    remainingItem.getStatus()
                            !=
                            OrderItemStatus.CANCELLED
            ) {

                hasActiveItem =
                        true;

                break;
            }
        }


        if (hasActiveItem) {

            synchronizeOrderStatus(
                    order
            );

        } else {

            // =================================================
            // ALL ITEMS CANCELLED
            // =================================================

            order.setStatus(
                    OrderStatus.CANCELLED
            );

            order.setSubtotal(
                    0.0
            );

            if (
                    order.getGstPercentage() == null
            ) {

                order.setGstPercentage(
                        restaurantSettingsService
                                .getGstPercentage()
                );
            }

            order.setGst(
                    0.0
            );

            order.setGrandTotal(
                    0.0
            );

            orderRepository.save(
                    order
            );
        }

        return item;
    }


    // =========================================================
    // RECALCULATE ORDER TOTALS
    // =========================================================
    //
    // ONLY READY + SERVED ARE BILLABLE.
    //
    // =========================================================

    private void recalculateOrderTotals(
            Order order
    ) {

        List<OrderItem> items =
                orderItemRepository.findByOrder(
                        order
                );

        double subtotal =
                0.0;


        double gstPercentage;

        if (
                order.getGstPercentage() != null
        ) {

            gstPercentage =
                    order.getGstPercentage();

        } else {

            gstPercentage =
                    restaurantSettingsService
                            .getGstPercentage();
        }


        for (OrderItem item : items) {

            if (
                    item == null
                            ||
                            item.getPrice() == null
            ) {
                continue;
            }

            if (
                    item.getStatus()
                            ==
                            OrderItemStatus.READY
                            ||
                            item.getStatus()
                                    ==
                                    OrderItemStatus.SERVED
            ) {

                subtotal +=
                        item.getPrice();
            }
        }


        double gst =
                subtotal
                        *
                        (
                                gstPercentage
                                        /
                                        100.0
                        );


        double grandTotal =
                subtotal + gst;


        order.setSubtotal(
                roundMoney(
                        subtotal
                )
        );

        order.setGstPercentage(
                gstPercentage
        );

        order.setGst(
                roundMoney(
                        gst
                )
        );

        order.setGrandTotal(
                roundMoney(
                        grandTotal
                )
        );


        orderRepository.save(
                order
        );
    }


    // =========================================================
    // ROUND MONEY
    // =========================================================

    private double roundMoney(
            double value
    ) {

        return Math.round(
                value * 100.0
        ) / 100.0;
    }


    // =========================================================
    // BILL DESK - CANCEL COMPLETE BILL
    // =========================================================

    public Order cancelCompleteBill(
            Long orderId
    ) {

        Order order =
                orderRepository.findById(
                                orderId
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Order Not Found"
                                )
                        );


        if (
                order.getStatus()
                        ==
                        OrderStatus.CANCELLED
        ) {

            throw new IllegalStateException(
                    "Order is already CANCELLED"
            );
        }


        if (
                order.getStatus()
                        ==
                        OrderStatus.PAID
        ) {

            throw new IllegalStateException(
                    "Paid order cannot be cancelled"
            );
        }


        List<OrderItem> items =
                orderItemRepository.findByOrder(
                        order
                );


        for (OrderItem item : items) {

            item.setStatus(
                    OrderItemStatus.CANCELLED
            );

            orderItemRepository.save(
                    item
            );
        }


        order.setStatus(
                OrderStatus.CANCELLED
        );

        order.setSubtotal(
                0.0
        );

        if (
                order.getGstPercentage() == null
        ) {

            order.setGstPercentage(
                    restaurantSettingsService
                            .getGstPercentage()
            );
        }

        order.setGst(
                0.0
        );

        order.setGrandTotal(
                0.0
        );


        return orderRepository.save(
                order
        );
    }
}