package com.scan2serve.repository;

import com.scan2serve.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    boolean existsByTableNumber(Integer tableNumber);

    List<RestaurantTable> findAllByOrderByTableNumberAsc();
}