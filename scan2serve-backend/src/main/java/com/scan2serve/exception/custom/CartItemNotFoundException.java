package com.scan2serve.exception.custom;

public class CartItemNotFoundException extends RuntimeException {

    public CartItemNotFoundException() {
        super("Cart Item Not Found");
    }

    public CartItemNotFoundException(String message) {
        super(message);
    }
}