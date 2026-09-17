package com.scan2serve.exception.custom;

public class CartEmptyException extends RuntimeException {

    public CartEmptyException() {
        super("Cart is Empty");
    }

    public CartEmptyException(String message) {
        super(message);
    }
}