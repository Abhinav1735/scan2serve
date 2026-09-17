package com.scan2serve.service;

import com.scan2serve.dto.AdminDashboardResponse;
import com.scan2serve.entity.Order;
import com.scan2serve.entity.Payment;
import com.scan2serve.entity.RestaurantTable;
import com.scan2serve.enums.OrderStatus;
import com.scan2serve.enums.PaymentStatus;
import com.scan2serve.repository.OrderRepository;
import com.scan2serve.repository.PaymentRepository;
import com.scan2serve.repository.RestaurantTableRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Service
public class AdminDashboardService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;


    public AdminDashboardResponse getDashboardData() {

        // =====================================================
        // ORDERS
        // =====================================================

        List<Order> allOrders =
                orderRepository.findAll();

        long totalOrders =
                allOrders.size();


        LocalDateTime startOfToday =
                LocalDate.now()
                        .atStartOfDay();

        LocalDateTime startOfTomorrow =
                LocalDate.now()
                        .plusDays(1)
                        .atStartOfDay();


        long todayOrders =
                allOrders.stream()
                        .filter(order ->
                                order.getOrderTime() != null
                                        &&
                                        !order.getOrderTime()
                                                .isBefore(startOfToday)
                                        &&
                                        order.getOrderTime()
                                                .isBefore(startOfTomorrow)
                        )
                        .count();


        long activeOrders =
                allOrders.stream()
                        .filter(order ->
                                order.getStatus() != null
                                        &&
                                        order.getStatus() != OrderStatus.PAID
                                        &&
                                        order.getStatus() != OrderStatus.CANCELLED
                                        &&
                                        order.getStatus() != OrderStatus.CLOSED
                        )
                        .count();


        long paidOrders =
                allOrders.stream()
                        .filter(order ->
                                order.getStatus()
                                        == OrderStatus.PAID
                        )
                        .count();


        // =====================================================
        // TODAY'S CANCELLED ORDERS
        // =====================================================

        long cancelledOrders =
                allOrders.stream()
                        .filter(order ->
                                order.getOrderTime() != null
                                        &&
                                        !order.getOrderTime()
                                                .isBefore(startOfToday)
                                        &&
                                        order.getOrderTime()
                                                .isBefore(startOfTomorrow)
                                        &&
                                        order.getStatus()
                                                == OrderStatus.CANCELLED
                        )
                        .count();


        // =====================================================
        // TODAY'S REVENUE
        // =====================================================

        List<Payment> payments =
                paymentRepository.findAll();


        double todayRevenue =
                payments.stream()
                        .filter(payment ->
                                payment.getPaymentTime() != null
                                        &&
                                        !payment.getPaymentTime()
                                                .isBefore(startOfToday)
                                        &&
                                        payment.getPaymentTime()
                                                .isBefore(startOfTomorrow)
                                        &&
                                        payment.getPaymentStatus()
                                                == PaymentStatus.COMPLETED
                        )
                        .mapToDouble(payment ->
                                payment.getAmount() != null
                                        ? payment.getAmount()
                                        : 0.0
                        )
                        .sum();


        // =====================================================
        // TABLES
        // =====================================================

        List<RestaurantTable> tables =
                restaurantTableRepository.findAll();


        long totalTables =
                tables.size();


        /*
         * A table is considered occupied when it has an
         * active order.
         *
         * PAID, CANCELLED and CLOSED orders are not considered
         * active.
         */

        long occupiedTables =
                allOrders.stream()
                        .filter(order ->
                                order.getTableNumber() != null
                                        &&
                                        order.getStatus() != null
                                        &&
                                        order.getStatus()
                                                != OrderStatus.PAID
                                        &&
                                        order.getStatus()
                                                != OrderStatus.CANCELLED
                                        &&
                                        order.getStatus()
                                                != OrderStatus.CLOSED
                        )
                        .map(Order::getTableNumber)
                        .distinct()
                        .count();


        long availableTables =
                Math.max(
                        0,
                        totalTables -
                                occupiedTables
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        return new AdminDashboardResponse(

                totalOrders,

                todayOrders,

                activeOrders,

                paidOrders,

                cancelledOrders,

                todayRevenue,

                totalTables,

                occupiedTables,

                availableTables
        );
    }
}