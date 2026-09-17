package com.scan2serve.controller;

import com.scan2serve.response.ApiResponse;
import com.scan2serve.dto.CustomerCategoryResponse;
import com.scan2serve.entity.Order;
import com.scan2serve.enums.OrderStatus;
import com.scan2serve.service.CustomerService;
import com.scan2serve.service.OrderService;
import com.scan2serve.service.RestaurantSettingsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private RestaurantSettingsService restaurantSettingsService;


    // =========================================================
    // CUSTOMER MENU
    // =========================================================

    @GetMapping("/menu")
    public List<CustomerCategoryResponse> getCustomerMenu() {

        return customerService.getCustomerMenu();
    }


    // =========================================================
    // CUSTOMER GST SETTINGS
    // =========================================================
    // Public endpoint used by the customer cart.
    // Returns the currently configured GST percentage.
    // Example:
    // GET /customer/settings/gst
    // =========================================================

    @GetMapping("/settings/gst")
    public ApiResponse<Double> getGstPercentage() {

        double gstPercentage =
                restaurantSettingsService.getGstPercentage();

        return new ApiResponse<>(
                true,
                "GST Percentage Found",
                gstPercentage
        );
    }


    // =========================================================
    // CURRENT ORDER FOR TABLE
    // =========================================================

    @GetMapping("/order/current/{tableNumber}")
    public ApiResponse<Order> getCurrentOrder(
            @PathVariable Integer tableNumber) {

        Order order =
                orderService.getCurrentOrder(tableNumber);

        if (order == null) {

            return new ApiResponse<>(
                    false,
                    "No Active Order",
                    null
            );
        }

        return new ApiResponse<>(
                true,
                "Current Order Found",
                order
        );
    }


    // =========================================================
    // ORDER STATUS
    // =========================================================

    @GetMapping("/order/{orderId}/status")
    public ApiResponse<OrderStatus> getOrderStatus(
            @PathVariable Long orderId) {

        OrderStatus status =
                orderService.getOrderStatus(orderId);

        return new ApiResponse<>(
                true,
                "Order Status Found",
                status
        );
    }
}