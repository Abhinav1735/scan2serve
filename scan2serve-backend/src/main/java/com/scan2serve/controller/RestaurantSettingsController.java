package com.scan2serve.controller;

import com.scan2serve.dto.GstSettingsRequest;
import com.scan2serve.entity.RestaurantSettings;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.RestaurantSettingsService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/settings")
public class RestaurantSettingsController {

    private final RestaurantSettingsService settingsService;


    public RestaurantSettingsController(
            RestaurantSettingsService settingsService
    ) {

        this.settingsService =
                settingsService;
    }


    // =========================================================
    // GET SETTINGS
    // =========================================================

    @GetMapping
    public ApiResponse<RestaurantSettings> getSettings() {

        return new ApiResponse<>(
                true,
                "Restaurant Settings Fetched Successfully",
                settingsService.getSettings()
        );
    }


    // =========================================================
    // UPDATE GST
    // =========================================================

    @PutMapping("/gst")
    public ApiResponse<RestaurantSettings> updateGst(
            @Valid
            @RequestBody
            GstSettingsRequest request
    ) {

        return new ApiResponse<>(
                true,
                "GST Percentage Updated Successfully",
                settingsService.updateGstPercentage(
                        request
                )
        );
    }
}