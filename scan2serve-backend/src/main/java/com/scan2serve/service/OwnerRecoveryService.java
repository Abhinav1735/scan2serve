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

    /*
     * IMPORTANT:
     * This key must NEVER be placed in frontend JavaScript,
     * HTML, GitHub, or Vercel.
     *
     * It will come from Render environment variables.
     */
    @Value("${app.recovery.owner-key:}")
    private String ownerRecoveryKey;

    /*
     * These values match the public demo credentials currently
     * shown on your landing page.
     *
     * You can override them through Render environment variables.
     */
    @Value("${app.recovery.admin.username:admin}")
    private String recoveryAdminUsername;

    @Value("${app.recovery.admin.password:Admin@12345}")
    private String recoveryAdminPassword;

    /**
     * Emergency Admin recovery.
     *
     * This method:
     * 1. Validates the private recovery key.
     * 2. Finds the existing "admin" account if possible.
     * 3. Otherwise finds an existing ADMIN account.
     * 4. Otherwise creates a new ADMIN account.
     * 5. Disables all other ADMIN accounts.
     * 6. Restores the known owner/demo Admin credentials.
     */
    public void resetAdmin(String suppliedRecoveryKey) {

        validateRecoveryKey(suppliedRecoveryKey);

        if (recoveryAdminPassword == null || recoveryAdminPassword.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Recovery admin password is not configured.");
        }

        /*
         * First try to find the account using the known recovery username.
         *
         * This also works if somebody changed the role of that account.
         */
        Employee admin = employeeRepository
                .findByUsername(recoveryAdminUsername)
                .orElse(null);

        /*
         * If username was changed, try to find an existing ADMIN account.
         */
        if (admin == null) {

            List<Employee> existingAdmins = employeeRepository.findAllByRole(EmployeeRole.ADMIN);

            if (!existingAdmins.isEmpty()) {
                admin = existingAdmins.get(0);
            }
        }

        /*
         * If the original Admin was deleted and no ADMIN exists,
         * create a completely new account.
         */
        if (admin == null) {
            admin = new Employee();
        }

        /*
         * Disable every other ADMIN account.
         *
         * This prevents an old/unknown Admin account from retaining
         * access after recovery.
         */
        List<Employee> existingAdmins = employeeRepository.findAllByRole(EmployeeRole.ADMIN);

        for (Employee existingAdmin : existingAdmins) {

            if (existingAdmin.getId() == null) {
                continue;
            }

            if (admin.getId() == null ||
                    !existingAdmin.getId().equals(admin.getId())) {

                existingAdmin.setActive(false);
                employeeRepository.save(existingAdmin);
            }
        }

        /*
         * Restore the owner Admin account.
         */
        admin.setName("System Administrator");
        admin.setUsername(recoveryAdminUsername);

        /*
         * NEVER save the plain password.
         *
         * AuthService already uses PasswordEncoder.matches()
         * during login, so we store the BCrypt hash here.
         */
        admin.setPassword(
                passwordEncoder.encode(recoveryAdminPassword));

        admin.setRole(EmployeeRole.ADMIN);
        admin.setActive(true);

        employeeRepository.save(admin);
    }

    /**
     * Validate the private recovery key.
     *
     * MessageDigest.isEqual() performs a constant-time comparison,
     * which is preferable to a normal String.equals() for secrets.
     */
    private void validateRecoveryKey(String suppliedRecoveryKey) {

        if (ownerRecoveryKey == null || ownerRecoveryKey.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Owner recovery is not configured on the server.");
        }

        if (suppliedRecoveryKey == null ||
                suppliedRecoveryKey.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid recovery key.");
        }

        byte[] expected = ownerRecoveryKey.getBytes(StandardCharsets.UTF_8);

        byte[] actual = suppliedRecoveryKey.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expected, actual)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid recovery key.");
        }
    }
}