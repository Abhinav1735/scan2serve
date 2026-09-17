package com.scan2serve.controller;

import com.scan2serve.entity.Menu;
import com.scan2serve.response.ApiResponse;
import com.scan2serve.service.MenuImageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/menu")
public class MenuImageController {

    private final MenuImageService menuImageService;

    public MenuImageController(
            MenuImageService menuImageService
    ) {
        this.menuImageService = menuImageService;
    }

    @PostMapping(
            value = "/{id}/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<Menu> uploadImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image
    ) {

        Menu menu =
                menuImageService.uploadImage(
                        id,
                        image
                );

        return new ApiResponse<>(
                true,
                "Menu Image Uploaded Successfully",
                menu
        );
    }

    @DeleteMapping("/{id}/image")
    public ApiResponse<Menu> removeImage(
            @PathVariable Long id
    ) {

        Menu menu =
                menuImageService.removeImage(id);

        return new ApiResponse<>(
                true,
                "Menu Image Removed Successfully",
                menu
        );
    }
}