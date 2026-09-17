package com.scan2serve.exception.custom;

public class MenuAlreadyDisabledException extends RuntimeException {

    public MenuAlreadyDisabledException() {
        super("Menu is already disabled");
    }

    public MenuAlreadyDisabledException(String message) {
        super(message);
    }
}