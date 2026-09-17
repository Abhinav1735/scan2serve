package com.scan2serve.exception;

import com.scan2serve.exception.custom.*;
import com.scan2serve.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==========================
    // Menu Exceptions
    // ==========================

    @ExceptionHandler(MenuNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleMenuNotFound(
            MenuNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(DuplicateMenuException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateMenu(
            DuplicateMenuException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(MenuAlreadyDisabledException.class)
    public ResponseEntity<ApiResponse<?>> handleMenuAlreadyDisabled(
            MenuAlreadyDisabledException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(MenuAlreadyEnabledException.class)
    public ResponseEntity<ApiResponse<?>> handleMenuAlreadyEnabled(
            MenuAlreadyEnabledException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Category Exceptions
    // ==========================

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleCategoryNotFound(
            CategoryNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(DuplicateCategoryException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateCategory(
            DuplicateCategoryException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Cart Exceptions
    // ==========================

    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleCartItemNotFound(
            CartItemNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(CartEmptyException.class)
    public ResponseEntity<ApiResponse<?>> handleCartEmpty(
            CartEmptyException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Order Exceptions
    // ==========================

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleOrderNotFound(
            OrderNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Table Exceptions
    // ==========================

    @ExceptionHandler(TableNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleTableNotFound(
            TableNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(DuplicateTableException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateTable(
            DuplicateTableException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Employee Exceptions
    // ==========================

    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEmployeeNotFound(
            EmployeeNotFoundException ex
    ) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(DuplicateEmployeeException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateEmployee(
            DuplicateEmployeeException ex
    ) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Authentication Exceptions
    // ==========================

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidCredentials(
            InvalidCredentialsException ex
    ) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    @ExceptionHandler(InactiveEmployeeException.class)
    public ResponseEntity<ApiResponse<?>> handleInactiveEmployee(
            InactiveEmployeeException ex
    ) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null
                ));
    }

    // ==========================
    // Validation Exception
    // ==========================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        String error = ex.getBindingResult()
                .getFieldError()
                .getDefaultMessage();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        error,
                        null
                ));
    }

    // ==========================
    // Generic Exception
    // ==========================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(
            Exception ex
    ) {

        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(
                        false,
                        "Something went wrong",
                        null
                ));
    }
}