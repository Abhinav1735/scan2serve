package com.scan2serve.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestController {
    @GetMapping("/test")
    public String testAPI() {

        return "Welcome to Scan2Serve 🚀";

    }

    @PostMapping("/order")
    public String placeOrder() {
        return "Order Placed Successfully";
    }

    @PutMapping("/order")
    public String updateOrder() {
        return "Order Updated Successfully";
    }

    @DeleteMapping("/order")
    public String deleteOrder() {
        return "Order Deleted Successfully";
    }
}
