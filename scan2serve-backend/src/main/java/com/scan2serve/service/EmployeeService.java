package com.scan2serve.service;

import com.scan2serve.dto.EmployeeRequest;
import com.scan2serve.dto.EmployeeResponse;
import com.scan2serve.entity.Employee;
import com.scan2serve.exception.custom.DuplicateEmployeeException;
import com.scan2serve.exception.custom.EmployeeNotFoundException;
import com.scan2serve.repository.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==========================
    // CREATE EMPLOYEE
    // ==========================

    public EmployeeResponse createEmployee(EmployeeRequest request) {

        if (employeeRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateEmployeeException(
                    "Username already exists"
            );
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "Password is required when creating an employee"
            );
        }

        Employee employee = new Employee();

        employee.setName(request.getName().trim());
        employee.setUsername(request.getUsername().trim());
        employee.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        employee.setRole(request.getRole());

        if (request.getActive() != null) {
            employee.setActive(request.getActive());
        } else {
            employee.setActive(true);
        }

        Employee savedEmployee = employeeRepository.save(employee);

        return new EmployeeResponse(savedEmployee);
    }

    // ==========================
    // GET ALL EMPLOYEES
    // ==========================

    public List<EmployeeResponse> getAllEmployees() {

        return employeeRepository.findAll()
                .stream()
                .map(EmployeeResponse::new)
                .toList();
    }

    // ==========================
    // GET EMPLOYEE BY ID
    // ==========================

    public EmployeeResponse getEmployeeById(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(EmployeeNotFoundException::new);

        return new EmployeeResponse(employee);
    }

    // ==========================
    // UPDATE EMPLOYEE
    // ==========================

    public EmployeeResponse updateEmployee(
            Long id,
            EmployeeRequest request
    ) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(EmployeeNotFoundException::new);

        employeeRepository.findByUsername(request.getUsername())
                .ifPresent(existingEmployee -> {

                    if (!existingEmployee.getId().equals(id)) {
                        throw new DuplicateEmployeeException(
                                "Username already exists"
                        );
                    }
                });

        employee.setName(request.getName().trim());
        employee.setUsername(request.getUsername().trim());
        employee.setRole(request.getRole());

        if (request.getActive() != null) {
            employee.setActive(request.getActive());
        }

        /*
         * Password is optional during update.
         * Blank password means keep existing password.
         */
        if (request.getPassword() != null &&
                !request.getPassword().isBlank()) {

            employee.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );
        }

        Employee updatedEmployee = employeeRepository.save(employee);

        return new EmployeeResponse(updatedEmployee);
    }

    // ==========================
    // DELETE EMPLOYEE
    // ==========================

    public void deleteEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(EmployeeNotFoundException::new);

        employeeRepository.delete(employee);
    }

    // ==========================
    // ACTIVATE EMPLOYEE
    // ==========================

    public EmployeeResponse activateEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(EmployeeNotFoundException::new);

        employee.setActive(true);

        return new EmployeeResponse(
                employeeRepository.save(employee)
        );
    }

    // ==========================
    // DEACTIVATE EMPLOYEE
    // ==========================

    public EmployeeResponse deactivateEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(EmployeeNotFoundException::new);

        employee.setActive(false);

        return new EmployeeResponse(
                employeeRepository.save(employee)
        );
    }
}