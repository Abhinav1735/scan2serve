package com.scan2serve.dto;

import com.scan2serve.enums.PaymentMethod;

public class PaymentRequest {

    private PaymentMethod paymentMethod;


    public PaymentRequest() {
    }


    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }


    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {

        this.paymentMethod =
                paymentMethod;
    }
}