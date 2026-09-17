package com.scan2serve.service;

import com.scan2serve.dto.RestaurantTableRequest;
import com.scan2serve.entity.RestaurantTable;
import com.scan2serve.exception.custom.DuplicateTableException;
import com.scan2serve.exception.custom.TableNotFoundException;
import com.scan2serve.repository.RestaurantTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantTableService {

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    // =========================================================
    // CREATE TABLE
    // =========================================================

    public RestaurantTable createTable(
            RestaurantTableRequest request
    ) {

        if (
                restaurantTableRepository
                        .existsByTableNumber(
                                request.getTableNumber()
                        )
        ) {

            throw new DuplicateTableException(
                    "Table Number already exists"
            );
        }

        RestaurantTable table =
                new RestaurantTable();

        table.setTableNumber(
                request.getTableNumber()
        );

        table.setActive(
                request.getActive()
        );

        return restaurantTableRepository.save(table);
    }

    // =========================================================
    // GET ALL TABLES
    // =========================================================

    public List<RestaurantTable> getAllTables() {

        return restaurantTableRepository
                .findAllByOrderByTableNumberAsc();
    }

    // =========================================================
    // GET TABLE BY ID
    // =========================================================

    public RestaurantTable getTableById(
            Long id
    ) {

        return restaurantTableRepository
                .findById(id)
                .orElseThrow(
                        TableNotFoundException::new
                );
    }

    // =========================================================
    // UPDATE TABLE
    // =========================================================

    public RestaurantTable updateTable(
            Long id,
            RestaurantTableRequest request
    ) {

        RestaurantTable table =
                restaurantTableRepository
                        .findById(id)
                        .orElseThrow(
                                TableNotFoundException::new
                        );

        /*
         * Check duplicate table number only
         * when the number is actually changed.
         */

        if (
                !table.getTableNumber()
                        .equals(
                                request.getTableNumber()
                        )
                        &&
                        restaurantTableRepository
                                .existsByTableNumber(
                                        request.getTableNumber()
                                )
        ) {

            throw new DuplicateTableException(
                    "Table Number already exists"
            );
        }

        table.setTableNumber(
                request.getTableNumber()
        );

        table.setActive(
                request.getActive()
        );

        return restaurantTableRepository.save(
                table
        );
    }

    // =========================================================
    // DELETE TABLE
    // =========================================================

    public String deleteTable(
            Long id
    ) {

        RestaurantTable table =
                restaurantTableRepository
                        .findById(id)
                        .orElseThrow(
                                TableNotFoundException::new
                        );

        restaurantTableRepository.delete(
                table
        );

        return "Table Deleted Successfully";
    }
}