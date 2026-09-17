package com.scan2serve.security;

import com.scan2serve.entity.Employee;
import com.scan2serve.repository.EmployeeRepository;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService
        implements UserDetailsService {

    private final EmployeeRepository employeeRepository;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public CustomUserDetailsService(
            EmployeeRepository employeeRepository
    ) {

        this.employeeRepository =
                employeeRepository;
    }


    // =========================================================
    // LOAD USER
    // =========================================================

    @Override
    public UserDetails loadUserByUsername(
            String username
    )
            throws UsernameNotFoundException {

        Employee employee =
                employeeRepository
                        .findByUsername(username)
                        .orElseThrow(
                                () ->
                                        new UsernameNotFoundException(
                                                "Employee not found"
                                        )
                        );


        return User
                .withUsername(
                        employee.getUsername()
                )
                .password(
                        employee.getPassword()
                )
                .roles(
                        employee
                                .getRole()
                                .name()
                )
                .disabled(
                        !employee.isActive()
                )
                .build();
    }

}