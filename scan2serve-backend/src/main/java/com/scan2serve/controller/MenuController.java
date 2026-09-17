package com.scan2serve.controller;

import com.scan2serve.dto.MenuRequest;
import com.scan2serve.entity.Menu;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/menu")
public class MenuController {

    @Autowired
    private MenuService menuService;

    // Create Menu
    @PostMapping
    public ApiResponse<Menu> createMenu(
            @Valid @RequestBody MenuRequest request) {

        Menu menu = menuService.saveMenu(request);

        return new ApiResponse<>(
                true,
                "Menu Created Successfully",
                menu
        );
    }

    // Get All Menus
    @GetMapping
    public ApiResponse<List<Menu>> getAllMenus() {

        return new ApiResponse<>(
                true,
                "Menus Fetched Successfully",
                menuService.getAllMenus()
        );
    }

    // Get Menu By Id
    @GetMapping("/{id}")
    public ApiResponse<Menu> getMenuById(
            @PathVariable Long id) {

        return new ApiResponse<>(
                true,
                "Menu Found",
                menuService.getMenuById(id)
        );
    }

    // Update Menu
    @PutMapping("/{id}")
    public ApiResponse<Menu> updateMenu(
            @PathVariable Long id,
            @Valid @RequestBody MenuRequest request) {

        Menu menu = menuService.updateMenu(id, request);

        return new ApiResponse<>(
                true,
                "Menu Updated Successfully",
                menu
        );
    }

    // Delete Menu
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteMenu(
            @PathVariable Long id) {

        String message = menuService.deleteMenu(id);

        return new ApiResponse<>(
                true,
                message,
                null
        );
    }

    // ============================
// Enable Menu
// ============================

    @PutMapping("/enable/{id}")
    public ApiResponse<String> enableMenu(@PathVariable Long id) {

        String message = menuService.enableMenu(id);

        return new ApiResponse<>(
                true,
                message,
                null
        );
    }
}