package com.scan2serve.dto;

import java.util.List;

public class CustomerCategoryResponse {

    private String category;
    private List<CustomerMenuItemResponse> items;

    public CustomerCategoryResponse() {
    }

    public CustomerCategoryResponse(String category,
                                    List<CustomerMenuItemResponse> items) {
        this.category = category;
        this.items = items;
    }

    public String getCategory() {
        return category;
    }

    public List<CustomerMenuItemResponse> getItems() {
        return items;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setItems(List<CustomerMenuItemResponse> items) {
        this.items = items;
    }
}