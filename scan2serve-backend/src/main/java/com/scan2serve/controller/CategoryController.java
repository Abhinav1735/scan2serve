package com.scan2serve.controller;

import com.scan2serve.entity.Category;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/category")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // ============================
    // Create Category
    // ============================

    @PostMapping
    public ApiResponse<Category> save(@Valid @RequestBody Category category) {

        Category savedCategory = categoryService.save(category);

        return new ApiResponse<>(
                true,
                "Category Created Successfully",
                savedCategory
        );
    }

    // ============================
    // Get All Categories
    // ============================

    @GetMapping
    public ApiResponse<List<Category>> getAll() {

        return new ApiResponse<>(
                true,
                "Categories Fetched Successfully",
                categoryService.getAll()
        );
    }

    // ============================
    // Get Category By Id
    // ============================

    @GetMapping("/{id}")
    public ApiResponse<Category> getById(@PathVariable Long id) {

        return new ApiResponse<>(
                true,
                "Category Fetched Successfully",
                categoryService.getById(id)
        );
    }

    // ============================
    // Update Category
    // ============================

    @PutMapping("/{id}")
    public ApiResponse<Category> update(
            @PathVariable Long id,
            @Valid @RequestBody Category category) {

        Category updatedCategory = categoryService.update(id, category);

        return new ApiResponse<>(
                true,
                "Category Updated Successfully",
                updatedCategory
        );
    }

    // ============================
    // Delete Category
    // ============================

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Long id) {

        categoryService.delete(id);

        return new ApiResponse<>(
                true,
                "Category Deleted Successfully",
                null
        );
    }
}