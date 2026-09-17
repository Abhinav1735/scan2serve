package com.scan2serve.controller;

import com.scan2serve.dto.EmployeeRequest;
import com.scan2serve.dto.EmployeeResponse;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // ==========================
    // CREATE EMPLOYEE
    // ==========================

    @PostMapping
    public ApiResponse<EmployeeResponse> createEmployee(
            @Valid @RequestBody EmployeeRequest request
    ) {

        return new ApiResponse<>(
                true,
                "Employee Created Successfully",
                employeeService.createEmployee(request)
        );
    }

    // ==========================
    // GET ALL EMPLOYEES
    // ==========================

    @GetMapping
    public ApiResponse<List<EmployeeResponse>> getAllEmployees() {

        return new ApiResponse<>(
                true,
                "Employees Fetched Successfully",
                employeeService.getAllEmployees()
        );
    }

    // ==========================
    // GET EMPLOYEE BY ID
    // ==========================

    @GetMapping("/{id}")
    public ApiResponse<EmployeeResponse> getEmployeeById(
            @PathVariable Long id
    ) {

        return new ApiResponse<>(
                true,
                "Employee Found",
                employeeService.getEmployeeById(id)
        );
    }

    // ==========================
    // UPDATE EMPLOYEE
    // ==========================

    @PutMapping("/{id}")
    public ApiResponse<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request
    ) {

        return new ApiResponse<>(
                true,
                "Employee Updated Successfully",
                employeeService.updateEmployee(id, request)
        );
    }

    // ==========================
    // DELETE EMPLOYEE
    // ==========================

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteEmployee(
            @PathVariable Long id
    ) {

        employeeService.deleteEmployee(id);

        return new ApiResponse<>(
                true,
                "Employee Deleted Successfully",
                null
        );
    }

    // ==========================
    // ACTIVATE
    // ==========================

    @PutMapping("/{id}/activate")
    public ApiResponse<EmployeeResponse> activateEmployee(
            @PathVariable Long id
    ) {

        return new ApiResponse<>(
                true,
                "Employee Activated Successfully",
                employeeService.activateEmployee(id)
        );
    }

    // ==========================
    // DEACTIVATE
    // ==========================

    @PutMapping("/{id}/deactivate")
    public ApiResponse<EmployeeResponse> deactivateEmployee(
            @PathVariable Long id
    ) {

        return new ApiResponse<>(
                true,
                "Employee Deactivated Successfully",
                employeeService.deactivateEmployee(id)
        );
    }
}