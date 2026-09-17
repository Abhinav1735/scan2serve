package com.scan2serve.repository;

import com.scan2serve.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    // For Customer
    List<Menu> findByAvailableTrue();

    // For Admin
    List<Menu> findAll();

    // Check Duplicate Menu
    Optional<Menu> findByNameIgnoreCase(String name);

    // Find only available menu by ID
    Optional<Menu> findByIdAndAvailableTrue(Long id);

}