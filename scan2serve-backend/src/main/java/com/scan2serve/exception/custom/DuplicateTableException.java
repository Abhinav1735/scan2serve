package com.scan2serve.exception.custom;

public class DuplicateTableException extends RuntimeException {

    public DuplicateTableException() {
        super("Table already exists");
    }

    public DuplicateTableException(String message) {
        super(message);
    }
}