package com.scan2serve.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.scan2serve.entity.RestaurantTable;
import com.scan2serve.repository.RestaurantTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class QrCodeService {

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // ============================
    // Generate Table QR Code
    // ============================

    public byte[] generateTableQr(Long tableId) {

        RestaurantTable table = restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table Not Found"));

        String customerUrl =
                frontendUrl + "/menu?table=" + table.getTableNumber();

        try {

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix bitMatrix = qrCodeWriter.encode(
                    customerUrl,
                    BarcodeFormat.QR_CODE,
                    300,
                    300
            );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {

            throw new RuntimeException("QR Code Generation Failed", e);
        }
    }
}