package com.scan2serve.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.scan2serve.entity.Menu;
import com.scan2serve.exception.custom.MenuNotFoundException;
import com.scan2serve.repository.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class MenuImageService {

    private static final long MAX_FILE_SIZE =
            5 * 1024 * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif"
            );

    private static final String CLOUDINARY_FOLDER =
            "scan2serve/menu-images";

    private final MenuRepository menuRepository;
    private final Cloudinary cloudinary;

    public MenuImageService(
            MenuRepository menuRepository,
            Cloudinary cloudinary
    ) {
        this.menuRepository = menuRepository;
        this.cloudinary = cloudinary;
    }

    /**
     * Upload a menu image to Cloudinary.
     *
     * The Cloudinary URL returned after upload is stored
     * in the Menu entity's imageUrl field.
     */
    public Menu uploadImage(
            Long menuId,
            MultipartFile image
    ) {

        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(MenuNotFoundException::new);

        validateImage(image);

        String oldImageUrl = menu.getImageUrl();

        try {

            Map<String, Object> uploadOptions =
                    ObjectUtils.asMap(
                            "folder", CLOUDINARY_FOLDER,
                            "resource_type", "image"
                    );

            Map<?, ?> uploadResult =
                    cloudinary.uploader().upload(
                            image.getBytes(),
                            uploadOptions
                    );

            Object secureUrl =
                    uploadResult.get("secure_url");

            if (secureUrl == null) {
                throw new IllegalStateException(
                        "Cloudinary did not return an image URL."
                );
            }

            String newImageUrl =
                    secureUrl.toString();

            menu.setImageUrl(newImageUrl);

            Menu savedMenu =
                    menuRepository.save(menu);

            /*
             * The database now contains the new
             * Cloudinary URL.
             *
             * Delete the old Cloudinary image only
             * after the database update succeeds.
             */
            deleteOldCloudinaryImage(oldImageUrl);

            return savedMenu;

        } catch (IOException ex) {

            menu.setImageUrl(oldImageUrl);

            throw new IllegalStateException(
                    "Unable to upload menu image to Cloudinary.",
                    ex
            );

        } catch (RuntimeException ex) {

            menu.setImageUrl(oldImageUrl);

            throw ex;
        }
    }

    /**
     * Remove the menu image.
     *
     * The database URL is cleared first.
     * The old Cloudinary image is then deleted.
     */
    public Menu removeImage(Long menuId) {

        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(MenuNotFoundException::new);

        String oldImageUrl =
                menu.getImageUrl();

        menu.setImageUrl(null);

        Menu savedMenu =
                menuRepository.save(menu);

        deleteOldCloudinaryImage(oldImageUrl);

        return savedMenu;
    }

    /**
     * Validate uploaded image.
     */
    private void validateImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select a menu image."
            );
        }

        if (image.getSize() > MAX_FILE_SIZE) {

            throw new IllegalArgumentException(
                    "Menu image must be 5 MB or smaller."
            );
        }

        String contentType =
                image.getContentType();

        if (
                contentType == null ||
                        !ALLOWED_CONTENT_TYPES.contains(
                                contentType.toLowerCase(Locale.ROOT)
                        )
        ) {

            throw new IllegalArgumentException(
                    "Only JPG, PNG, WEBP and GIF images are allowed."
            );
        }
    }

    /**
     * Delete an old Cloudinary image.
     *
     * Existing local /uploads URLs are ignored.
     * This is intentional so existing database records
     * don't cause errors during migration.
     */
    private void deleteOldCloudinaryImage(
            String imageUrl
    ) {

        if (
                imageUrl == null ||
                        imageUrl.isBlank()
        ) {
            return;
        }

        /*
         * Only attempt deletion for Cloudinary URLs.
         */
        if (!imageUrl.contains("res.cloudinary.com")) {
            return;
        }

        try {

            String publicId =
                    extractCloudinaryPublicId(imageUrl);

            if (
                    publicId == null ||
                            publicId.isBlank()
            ) {
                return;
            }

            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type", "image"
                    )
            );

        } catch (Exception ignored) {

            /*
             * The database operation has already succeeded.
             * Failure to delete an old Cloudinary image should
             * not break the menu operation.
             */
        }
    }

    /**
     * Extract the Cloudinary public ID from a delivery URL.
     *
     * Example:
     *
     * https://res.cloudinary.com/cloud/image/upload/v123/
     * scan2serve/menu-images/abc123.jpg
     *
     * becomes:
     *
     * scan2serve/menu-images/abc123
     */
    private String extractCloudinaryPublicId(
            String imageUrl
    ) {

        try {

            String marker = "/upload/";

            int uploadIndex =
                    imageUrl.indexOf(marker);

            if (uploadIndex == -1) {
                return null;
            }

            String path =
                    imageUrl.substring(
                            uploadIndex + marker.length()
                    );

            /*
             * Remove optional transformation/version
             * information before the public ID.
             */
            if (path.startsWith("v")) {

                int slashIndex =
                        path.indexOf('/');

                if (slashIndex > 0) {

                    String possibleVersion =
                            path.substring(
                                    1,
                                    slashIndex
                            );

                    if (possibleVersion.matches("\\d+")) {

                        path =
                                path.substring(
                                        slashIndex + 1
                                );
                    }
                }
            }

            /*
             * Remove file extension.
             */
            int extensionIndex =
                    path.lastIndexOf('.');

            if (extensionIndex > -1) {

                path =
                        path.substring(
                                0,
                                extensionIndex
                        );
            }

            return path;

        } catch (Exception ex) {

            return null;
        }
    }
}