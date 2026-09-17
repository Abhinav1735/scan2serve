package com.scan2serve.exception.custom;

public class DuplicateMenuException extends RuntimeException {

    public DuplicateMenuException() {
        super("Menu already exists");
    }

    public DuplicateMenuException(String message) {
        super(message);
    }
}