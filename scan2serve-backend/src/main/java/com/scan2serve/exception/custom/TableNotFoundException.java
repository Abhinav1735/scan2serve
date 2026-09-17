package com.scan2serve.exception.custom;

public class TableNotFoundException extends RuntimeException {

    public TableNotFoundException() {
        super("Table Not Found");
    }

    public TableNotFoundException(String message) {
        super(message);
    }
}