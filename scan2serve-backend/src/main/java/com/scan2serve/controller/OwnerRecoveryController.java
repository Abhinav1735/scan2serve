package com.scan2serve.controller;

import com.scan2serve.service.OwnerRecoveryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/recovery")
public class OwnerRecoveryController {

    private final OwnerRecoveryService ownerRecoveryService;

    public OwnerRecoveryController(
            OwnerRecoveryService ownerRecoveryService) {

        this.ownerRecoveryService = ownerRecoveryService;
    }

    /**
     * Emergency Admin recovery endpoint.
     *
     * IMPORTANT:
     * Do NOT create a button for this on the public website.
     *
     * Call this endpoint manually using Postman/curl
     * with the private X-Owner-Recovery-Key header.
     */
    @PostMapping("/reset-admin")
    public ResponseEntity<String> resetAdmin(
            @RequestHeader(value = "X-Owner-Recovery-Key", required = false) String recoveryKey) {

        ownerRecoveryService.resetAdmin(recoveryKey);

        return ResponseEntity.ok(
                "Admin recovery completed successfully.");
    }
}