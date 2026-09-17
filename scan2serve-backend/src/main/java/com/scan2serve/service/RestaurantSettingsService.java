package com.scan2serve.service;

import com.scan2serve.dto.GstSettingsRequest;
import com.scan2serve.entity.RestaurantSettings;
import com.scan2serve.repository.RestaurantSettingsRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RestaurantSettingsService {

    private static final double DEFAULT_GST_PERCENTAGE = 5.0;

    private final RestaurantSettingsRepository repository;


    public RestaurantSettingsService(
            RestaurantSettingsRepository repository
    ) {

        this.repository = repository;
    }


    // =========================================================
    // GET CURRENT GST
    // =========================================================

    public double getGstPercentage() {

        RestaurantSettings settings =
                getOrCreateSettings();


        if (
                settings.getGstPercentage() == null
        ) {

            return DEFAULT_GST_PERCENTAGE;
        }


        return settings.getGstPercentage();
    }


    // =========================================================
    // GET ALL SETTINGS
    // =========================================================

    public RestaurantSettings getSettings() {

        return getOrCreateSettings();
    }


    // =========================================================
    // UPDATE GST
    // =========================================================

    public RestaurantSettings updateGstPercentage(
            GstSettingsRequest request
    ) {

        if (
                request == null
                        ||
                        request.getGstPercentage() == null
        ) {

            throw new IllegalArgumentException(
                    "GST percentage is required"
            );
        }


        double value =
                request.getGstPercentage();


        if (
                !Double.isFinite(value)
                        ||
                        value < 0
                        ||
                        value > 100
        ) {

            throw new IllegalArgumentException(
                    "GST percentage must be between 0 and 100"
            );
        }


        RestaurantSettings settings =
                getOrCreateSettings();


        settings.setGstPercentage(
                value
        );


        return repository.save(
                settings
        );
    }


    // =========================================================
    // GET OR CREATE SETTINGS
    // =========================================================

    private RestaurantSettings getOrCreateSettings() {

        return repository
                .findTopByOrderByIdAsc()
                .orElseGet(() -> {

                    RestaurantSettings settings =
                            new RestaurantSettings();


                    settings.setGstPercentage(
                            DEFAULT_GST_PERCENTAGE
                    );


                    return repository.save(
                            settings
                    );
                });
    }
}