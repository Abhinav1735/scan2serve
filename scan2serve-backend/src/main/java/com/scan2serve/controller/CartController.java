package com.scan2serve.controller;

import com.scan2serve.dto.CartRequest;
import com.scan2serve.entity.Cart;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    // ==========================
    // Add Item To Cart
    // ==========================

    @PostMapping
    public ApiResponse<Cart> addToCart(
            @Valid @RequestBody CartRequest request) {

        Cart cart = cartService.addToCart(request);

        return new ApiResponse<>(
                true,
                "Item Added Successfully",
                cart
        );
    }


    // ==========================
    // Get Cart By Table Number
    // ==========================

    @GetMapping("/{tableNumber}")
    public ApiResponse<List<Cart>> getCart(
            @PathVariable Integer tableNumber) {

        List<Cart> cart = cartService.getCart(tableNumber);

        return new ApiResponse<>(
                true,
                "Cart Fetched Successfully",
                cart
        );
    }


    // ==========================
    // Update Cart Item Quantity
    // ==========================

    @PutMapping("/{id}")
    public ApiResponse<Cart> updateQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {

        Cart cart = cartService.updateQuantity(id, quantity);

        return new ApiResponse<>(
                true,
                "Cart Quantity Updated Successfully",
                cart
        );
    }


    // ==========================
    // Remove Single Item
    // ==========================

    @DeleteMapping("/{id}")
    public ApiResponse<String> removeItem(
            @PathVariable Long id) {

        String message = cartService.removeItem(id);

        return new ApiResponse<>(
                true,
                message,
                null
        );
    }


    // ==========================
    // Clear Complete Cart
    // ==========================

    @DeleteMapping("/table/{tableNumber}")
    public ApiResponse<String> clearCart(
            @PathVariable Integer tableNumber) {

        String message = cartService.clearCart(tableNumber);

        return new ApiResponse<>(
                true,
                message,
                null
        );
    }
}