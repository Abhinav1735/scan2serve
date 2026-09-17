package com.scan2serve.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_settings")
public class RestaurantSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "gst_percentage",
            nullable = false
    )
    private Double gstPercentage = 5.0;


    public RestaurantSettings() {
    }


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
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