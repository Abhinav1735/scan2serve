package com.scan2serve.controller;

import com.scan2serve.dto.AdminDashboardResponse;
import com.scan2serve.service.AdminDashboardService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/dashboard")
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService adminDashboardService;


    // =========================================================
    // GET DASHBOARD DATA
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getDashboardData() {

        try {

            AdminDashboardResponse dashboard =
                    adminDashboardService
                            .getDashboardData();

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "data",
                    dashboard
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .internalServerError()
                    .body(response);
        }
    }
}