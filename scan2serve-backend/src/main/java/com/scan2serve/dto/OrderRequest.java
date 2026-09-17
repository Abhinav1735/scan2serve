package com.scan2serve.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class OrderRequest {

    // =========================================================
    // TABLE NUMBER
    // =========================================================

    @NotNull(message = "Table Number is required")
    private Integer tableNumber;


    // =========================================================
    // CUSTOMER NAME
    // =========================================================

    @NotBlank(message = "Customer Name is required")
    @Size(
            min = 2,
            max = 100,
            message = "Customer Name must be between 2 and 100 characters"
    )
    private String customerName;


    // =========================================================
    // CUSTOMER PHONE
    // =========================================================

    @NotBlank(message = "Customer Phone is required")
    @Pattern(
            regexp = "^[6-9][0-9]{9}$",
            message = "Customer Phone must be a valid 10-digit mobile number"
    )
    private String customerPhone;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public OrderRequest() {
    }


    // =========================================================
    // TABLE NUMBER GETTER
    // =========================================================

    public Integer getTableNumber() {
        return tableNumber;
    }


    // =========================================================
    // TABLE NUMBER SETTER
    // =========================================================

    public void setTableNumber(
            Integer tableNumber
    ) {
        this.tableNumber = tableNumber;
    }


    // =========================================================
    // CUSTOMER NAME GETTER
    // =========================================================

    public String getCustomerName() {
        return customerName;
    }


    // =========================================================
    // CUSTOMER NAME SETTER
    // =========================================================

    public void setCustomerName(
            String customerName
    ) {
        this.customerName =
                customerName != null
                        ? customerName.trim()
                        : null;
    }


    // =========================================================
    // CUSTOMER PHONE GETTER
    // =========================================================

    public String getCustomerPhone() {
        return customerPhone;
    }


    // =========================================================
    // CUSTOMER PHONE SETTER
    // =========================================================

    public void setCustomerPhone(
            String customerPhone
    ) {
        this.customerPhone =
                customerPhone != null
                        ? customerPhone.trim()
                        : null;
    }
}