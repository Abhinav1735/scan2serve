package com.scan2serve.exception.custom;

public class InactiveEmployeeException extends RuntimeException {

    public InactiveEmployeeException() {
        super("Employee account is inactive");
    }
}