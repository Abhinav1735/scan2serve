package com.scan2serve.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class GstSettingsRequest {

    @NotNull(
            message = "GST percentage is required"
    )
    @DecimalMin(
            value = "0.0",
            message = "GST percentage cannot be negative"
    )
    @DecimalMax(
            value = "100.0",
            message = "GST percentage cannot exceed 100"
    )
    private Double gstPercentage;


    public GstSettingsRequest() {
    }


    public Double getGstPercentage() {
        return gstPercentage;
    }


    public void setGstPercentage(
            Double gstPercentage
    ) {
        this.gstPercentage = gstPercentage;
    }
}