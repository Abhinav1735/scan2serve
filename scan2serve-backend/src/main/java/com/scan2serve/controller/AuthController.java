package com.scan2serve.controller;

import com.scan2serve.dto.LoginRequest;
import com.scan2serve.dto.LoginResponse;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return new ApiResponse<>(
                true,
                "Login Successful",
                authService.login(request)
        );
    }
}