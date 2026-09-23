package com.scan2serve.repository;

import com.scan2serve.entity.Employee;
import com.scan2serve.enums.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

        Optional<Employee> findByUsername(String username);

        boolean existsByUsername(String username);

        List<Employee> findAllByRole(EmployeeRole role);
}