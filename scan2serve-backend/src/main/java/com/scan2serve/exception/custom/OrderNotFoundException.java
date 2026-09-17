package com.scan2serve.exception.custom;

public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException() {
        super("Order Not Found");
    }

    public OrderNotFoundException(String message) {
        super(message);
    }
}