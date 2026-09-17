package com.scan2serve.service;

import com.scan2serve.dto.CustomerCategoryResponse;
import com.scan2serve.dto.CustomerMenuItemResponse;
import com.scan2serve.entity.Category;
import com.scan2serve.entity.Menu;
import com.scan2serve.repository.CategoryRepository;
import com.scan2serve.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CustomerService {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private CategoryRepository categoryRepository;


    /**
     * Returns the customer menu in the exact category
     * display order configured by the admin.
     *
     * Only available menu items are shown.
     *
     * Category item counts are NOT returned separately
     * because the customer frontend does not need to
     * display "3 items", "5 items", etc.
     */
    public List<CustomerCategoryResponse> getCustomerMenu() {

        /*
         * Get categories in admin-defined display order.
         *
         * CategoryRepository already provides:
         *
         * findAllByOrderByDisplayOrderAsc()
         */
        List<Category> categories =
                categoryRepository.findAllByOrderByDisplayOrderAsc();


        /*
         * Get only available menu items.
         */
        List<Menu> availableMenus =
                menuRepository.findByAvailableTrue();


        /*
         * Group available menu items by category ID.
         *
         * HashMap is used only for lookup.
         * The final response follows the ordered
         * categories list above.
         */
        Map<Long, List<Menu>> menusByCategory =
                new HashMap<>();


        for (Menu menu : availableMenus) {

            if (menu == null) {
                continue;
            }


            Category category =
                    menu.getCategory();


            if (category == null) {
                continue;
            }


            Long categoryId =
                    category.getId();


            if (categoryId == null) {
                continue;
            }


            menusByCategory
                    .computeIfAbsent(
                            categoryId,
                            key -> new ArrayList<>()
                    )
                    .add(menu);
        }


        /*
         * Build customer response according to
         * Category.displayOrder.
         */
        List<CustomerCategoryResponse> response =
                new ArrayList<>();


        for (Category category : categories) {

            if (category == null) {
                continue;
            }


            Long categoryId =
                    category.getId();


            if (categoryId == null) {
                continue;
            }


            List<Menu> categoryMenus =
                    menusByCategory.get(categoryId);


            /*
             * Do not show empty categories to customers.
             *
             * If a category has no available food items,
             * it will not appear on the customer menu.
             */
            if (
                    categoryMenus == null ||
                            categoryMenus.isEmpty()
            ) {
                continue;
            }


            List<CustomerMenuItemResponse> items =
                    new ArrayList<>();


            for (Menu menu : categoryMenus) {

                items.add(
                        new CustomerMenuItemResponse(
                                menu.getId(),
                                menu.getName(),
                                menu.getDescription(),
                                menu.getPrice(),
                                menu.getImageUrl()
                        )
                );
            }


            response.add(
                    new CustomerCategoryResponse(
                            category.getName(),
                            items
                    )
            );
        }


        return response;
    }
}