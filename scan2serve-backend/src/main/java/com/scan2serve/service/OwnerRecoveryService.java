package com.scan2serve.service;

import com.scan2serve.entity.Employee;
import com.scan2serve.enums.EmployeeRole;
import com.scan2serve.repository.EmployeeRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Service
public class OwnerRecoveryService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.recovery.owner-key:}")
    private String ownerRecoveryKey;

    @Value("${app.recovery.admin.username:admin}")
    private String recoveryAdminUsername;

    @Value("${app.recovery.admin.password:Admin@12345}")
    private String recoveryAdminPassword;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    public OwnerRecoveryService(
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder) {

        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ============================================================
    // RESET ADMIN
    // ============================================================

    public void resetAdmin(String suppliedRecoveryKey) {

        validateRecoveryKey(suppliedRecoveryKey);

        if (recoveryAdminPassword == null
                || recoveryAdminPassword.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Recovery admin password is not configured.");
        }

        /*
         * First try the configured recovery username.
         *
         * Example:
         * admin
         */
        Employee admin = employeeRepository
                .findByUsername(recoveryAdminUsername)
                .orElse(null);

        /*
         * If the username was changed,
         * find an existing ADMIN account.
         */
        if (admin == null) {

            List<Employee> existingAdmins = employeeRepository.findAllByRole(
                    EmployeeRole.ADMIN);

            if (!existingAdmins.isEmpty()) {
                admin = existingAdmins.get(0);
            }
        }

        /*
         * If the original Admin account was deleted,
         * create a completely new account.
         */
        if (admin == null) {
            admin = new Employee();
        }

        /*
         * Disable all other ADMIN accounts.
         *
         * This prevents another unknown ADMIN account
         * from keeping dashboard access.
         */
        List<Employee> existingAdmins = employeeRepository.findAllByRole(
                EmployeeRole.ADMIN);

        for (Employee existingAdmin : existingAdmins) {

            if (existingAdmin.getId() == null) {
                continue;
            }

            if (admin.getId() == null
                    || !existingAdmin.getId()
                            .equals(admin.getId())) {

                existingAdmin.setActive(false);

                employeeRepository.save(existingAdmin);
            }
        }

        /*
         * Restore the owner/demo Admin account.
         */
        admin.setName("System Administrator");

        admin.setUsername(
                recoveryAdminUsername);

        /*
         * Always encode the password.
         */
        admin.setPassword(
                passwordEncoder.encode(
                        recoveryAdminPassword));

        admin.setRole(
                EmployeeRole.ADMIN);

        admin.setActive(true);

        /*
         * Save restored Admin.
         */
        employeeRepository.save(admin);
    }

    // ============================================================
    // VALIDATE RECOVERY KEY
    // ============================================================

    private void validateRecoveryKey(
            String suppliedRecoveryKey) {

        /*
         * Recovery key has not been configured.
         */
        if (ownerRecoveryKey == null
                || ownerRecoveryKey.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Owner recovery is not configured on the server.");
        }

        /*
         * No key supplied.
         */
        if (suppliedRecoveryKey == null
                || suppliedRecoveryKey.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid recovery key.");
        }

        byte[] expected = ownerRecoveryKey.getBytes(
                StandardCharsets.UTF_8);

        byte[] actual = suppliedRecoveryKey.getBytes(
                StandardCharsets.UTF_8);

        /*
         * Constant-time comparison.
         */
        if (!MessageDigest.isEqual(
                expected,
                actual)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid recovery key.");
        }
    }
}