package com.scan2serve.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RestaurantTableRequest {

    @NotNull(message = "Table number is required")
    @Min(
            value = 1,
            message = "Table number must be a positive whole number"
    )
    private Integer tableNumber;

    @NotNull(message = "Table active status is required")
    private Boolean active;

    public RestaurantTableRequest() {
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public Boolean getActive() {
        return active;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}