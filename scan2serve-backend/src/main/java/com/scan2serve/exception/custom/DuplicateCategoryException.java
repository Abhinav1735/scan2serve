package com.scan2serve.exception.custom;

public class DuplicateCategoryException extends RuntimeException {

    public DuplicateCategoryException() {
        super("Category already exists");
    }

    public DuplicateCategoryException(String message) {
        super(message);
    }
}