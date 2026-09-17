package com.scan2serve.service;

import com.scan2serve.entity.Category;
import com.scan2serve.exception.custom.CategoryNotFoundException;
import com.scan2serve.exception.custom.DuplicateCategoryException;
import com.scan2serve.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // ============================
    // Create Category
    // ============================

    public Category save(Category category) {

        if (categoryRepository.findByNameIgnoreCase(category.getName()).isPresent()) {
            throw new DuplicateCategoryException();
        }

        return categoryRepository.save(category);
    }

    // ============================
    // Get All Categories
    // ============================

    public List<Category> getAll() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    // ============================
    // Get Category By Id
    // ============================

    public Category getById(Long id) {

        return categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);
    }

    // ============================
    // Update Category
    // ============================

    public Category update(Long id, Category request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);

        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.findByNameIgnoreCase(request.getName()).isPresent()) {

            throw new DuplicateCategoryException();
        }

        category.setName(request.getName());
        category.setDisplayOrder(request.getDisplayOrder());

        return categoryRepository.save(category);
    }

    // ============================
    // Delete Category
    // ============================

    public String delete(Long id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(CategoryNotFoundException::new);

        categoryRepository.delete(category);

        return "Category Deleted Successfully";
    }

}