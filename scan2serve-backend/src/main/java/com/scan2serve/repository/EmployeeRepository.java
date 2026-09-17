package com.scan2serve.repository;

import com.scan2serve.entity.Employee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository
        extends JpaRepository<Employee, Long> {

    Optional<Employee> findByUsername(
            String username
    );


    boolean existsByUsername(
            String username
    );

}