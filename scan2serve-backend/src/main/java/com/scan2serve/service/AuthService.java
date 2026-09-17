package com.scan2serve.service;

import com.scan2serve.dto.EmployeeResponse;
import com.scan2serve.dto.LoginRequest;
import com.scan2serve.dto.LoginResponse;
import com.scan2serve.entity.Employee;
import com.scan2serve.exception.custom.InactiveEmployeeException;
import com.scan2serve.exception.custom.InvalidCredentialsException;
import com.scan2serve.repository.EmployeeRepository;
import com.scan2serve.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {

        Employee employee = employeeRepository
                .findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if (!employee.isActive()) {
            throw new InactiveEmployeeException();
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                employee.getPassword()
        )) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(
                employee.getUsername(),
                employee.getId(),
                employee.getRole().name()
        );

        return new LoginResponse(
                token,
                "Bearer",
                new EmployeeResponse(employee)
        );
    }
}