package com.scan2serve.config;

import com.scan2serve.entity.Employee;
import com.scan2serve.enums.EmployeeRole;
import com.scan2serve.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin.name:System Administrator}")
    private String adminName;

    @Value("${app.initial-admin.username:admin}")
    private String adminUsername;

    @Value("${app.initial-admin.password:Admin@12345}")
    private String adminPassword;

    public DataInitializer(
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        /*
         * Create the initial ADMIN only when no employees exist.
         *
         * This prevents the application from recreating the
         * administrator every time it starts.
         */
        if (employeeRepository.count() > 0) {
            return;
        }

        Employee admin = new Employee();

        admin.setName(adminName);
        admin.setUsername(adminUsername);

        // Never store the password as plain text.
        admin.setPassword(
                passwordEncoder.encode(adminPassword)
        );

        admin.setRole(EmployeeRole.ADMIN);
        admin.setActive(true);

        employeeRepository.save(admin);

        System.out.println(
                "================================================="
        );
        System.out.println(
                "Initial ADMIN account created successfully."
        );
        System.out.println(
                "Username: " + adminUsername
        );
        System.out.println(
                "================================================="
        );
    }
}