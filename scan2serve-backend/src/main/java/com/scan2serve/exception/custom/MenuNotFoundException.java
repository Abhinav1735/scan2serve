package com.scan2serve.exception.custom;

public class MenuNotFoundException extends RuntimeException {

    public MenuNotFoundException() {
        super("Menu Not Found");
    }

    public MenuNotFoundException(String message) {
        super(message);
    }
}