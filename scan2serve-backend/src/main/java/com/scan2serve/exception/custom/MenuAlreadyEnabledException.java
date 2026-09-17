package com.scan2serve.exception.custom;

public class MenuAlreadyEnabledException extends RuntimeException {

    public MenuAlreadyEnabledException() {
        super("Menu is already enabled");
    }

    public MenuAlreadyEnabledException(String message) {
        super(message);
    }
}