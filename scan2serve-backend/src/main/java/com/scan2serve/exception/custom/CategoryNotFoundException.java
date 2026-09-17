package com.scan2serve.exception.custom;

public class CategoryNotFoundException extends RuntimeException {

    public CategoryNotFoundException() {
        super("Category Not Found");
    }

    public CategoryNotFoundException(String message) {
        super(message);
    }
}