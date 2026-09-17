package com.scan2serve.service;

import com.scan2serve.dto.MenuRequest;
import com.scan2serve.entity.Category;
import com.scan2serve.entity.Menu;
import com.scan2serve.exception.custom.CategoryNotFoundException;
import com.scan2serve.exception.custom.DuplicateMenuException;
import com.scan2serve.exception.custom.MenuAlreadyDisabledException;
import com.scan2serve.exception.custom.MenuAlreadyEnabledException;
import com.scan2serve.exception.custom.MenuNotFoundException;
import com.scan2serve.repository.CategoryRepository;
import com.scan2serve.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    // ============================
    // Create Menu
    // ============================

    public Menu saveMenu(MenuRequest request) {

        if (menuRepository.findByNameIgnoreCase(request.getName()).isPresent()) {
            throw new DuplicateMenuException();
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(CategoryNotFoundException::new);

        Menu menu = new Menu();
        menu.setName(request.getName());
        menu.setDescription(request.getDescription());
        menu.setPrice(request.getPrice());
        menu.setAvailable(request.getAvailable());
        menu.setCategory(category);

        return menuRepository.save(menu);
    }

    // ============================
    // Get All Menus
    // ============================

    public List<Menu> getAllMenus() {
        return menuRepository.findAll();
    }

    // ============================
    // Get Menu By Id
    // ============================

    public Menu getMenuById(Long id) {

        return menuRepository.findById(id)
                .orElseThrow(MenuNotFoundException::new);
    }

    // ============================
    // Update Menu
    // ============================

    public Menu updateMenu(Long id, MenuRequest request) {

        Menu menu = menuRepository.findById(id)
                .orElseThrow(MenuNotFoundException::new);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(CategoryNotFoundException::new);

        if (!menu.getName().equalsIgnoreCase(request.getName())
                && menuRepository.findByNameIgnoreCase(request.getName()).isPresent()) {

            throw new DuplicateMenuException();
        }

        menu.setName(request.getName());
        menu.setDescription(request.getDescription());
        menu.setPrice(request.getPrice());
        menu.setAvailable(request.getAvailable());
        menu.setCategory(category);

        return menuRepository.save(menu);
    }

    // ============================
    // Soft Delete Menu
    // ============================

    public String deleteMenu(Long id) {

        Menu menu = menuRepository.findById(id)
                .orElseThrow(MenuNotFoundException::new);

        if (!menu.getAvailable()) {
            throw new MenuAlreadyDisabledException();
        }

        menu.setAvailable(false);

        menuRepository.save(menu);

        return "Menu Disabled Successfully";
    }

    // ============================
    // Enable Menu
    // ============================

    public String enableMenu(Long id) {

        Menu menu = menuRepository.findById(id)
                .orElseThrow(MenuNotFoundException::new);

        if (menu.getAvailable()) {
            throw new MenuAlreadyEnabledException();
        }

        menu.setAvailable(true);

        menuRepository.save(menu);

        return "Menu Enabled Successfully";
    }
}