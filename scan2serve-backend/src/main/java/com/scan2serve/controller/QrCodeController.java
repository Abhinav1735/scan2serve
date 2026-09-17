package com.scan2serve.controller;

import com.scan2serve.service.QrCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/table")
public class QrCodeController {

    @Autowired
    private QrCodeService qrCodeService;

    // ============================
    // Generate Table QR Code
    // ============================

    @GetMapping("/{tableId}/qr")
    public ResponseEntity<byte[]> generateQr(
            @PathVariable Long tableId) {

        byte[] qrCode = qrCodeService.generateTableQr(tableId);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=table-" + tableId + "-qr.png"
                )
                .contentType(MediaType.IMAGE_PNG)
                .body(qrCode);
    }

    // ============================
// Download Table QR Code
// ============================

    @GetMapping("/{tableId}/qr/download")
    public ResponseEntity<byte[]> downloadQr(
            @PathVariable Long tableId) {

        byte[] qrCode = qrCodeService.generateTableQr(tableId);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=table-" + tableId + "-qr.png"
                )
                .contentType(MediaType.IMAGE_PNG)
                .body(qrCode);
    }
}