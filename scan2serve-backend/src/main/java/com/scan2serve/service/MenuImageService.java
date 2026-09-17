package com.scan2serve.service;

import com.scan2serve.entity.Menu;
import com.scan2serve.exception.custom.MenuNotFoundException;
import com.scan2serve.repository.MenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

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

    private static final String IMAGE_URL_PREFIX =
            "/uploads/menu-images/";

    private static final Path IMAGE_DIRECTORY =
            Paths.get("uploads/menu-images")
                    .toAbsolutePath()
                    .normalize();

    private final MenuRepository menuRepository;

    public MenuImageService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public Menu uploadImage(
            Long menuId,
            MultipartFile image
    ) {

        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(MenuNotFoundException::new);

        validateImage(image);

        String oldImageUrl = menu.getImageUrl();

        Path newImagePath = null;

        try {

            Files.createDirectories(IMAGE_DIRECTORY);

            String extension =
                    getExtension(image.getContentType());

            String fileName =
                    UUID.randomUUID() + extension;

            newImagePath =
                    IMAGE_DIRECTORY
                            .resolve(fileName)
                            .normalize();

            if (!newImagePath.startsWith(IMAGE_DIRECTORY)) {
                throw new IllegalArgumentException(
                        "Invalid image file."
                );
            }

            try (InputStream inputStream =
                         image.getInputStream()) {

                Files.copy(
                        inputStream,
                        newImagePath,
                        StandardCopyOption.REPLACE_EXISTING
                );
            }

            menu.setImageUrl(
                    IMAGE_URL_PREFIX + fileName
            );

            Menu savedMenu =
                    menuRepository.save(menu);

            /*
             * Delete old image only after the database
             * successfully stores the new image URL.
             */
            deleteStoredImage(oldImageUrl);

            return savedMenu;

        } catch (IOException ex) {

            deleteFileQuietly(newImagePath);

            /*
             * Restore old image URL in memory.
             */
            menu.setImageUrl(oldImageUrl);

            throw new IllegalStateException(
                    "Unable to save menu image."
            );

        } catch (RuntimeException ex) {

            /*
             * If database save fails, remove the newly
             * uploaded file and restore the old URL.
             */
            deleteFileQuietly(newImagePath);

            menu.setImageUrl(oldImageUrl);

            throw ex;
        }
    }

    public Menu removeImage(Long menuId) {

        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(MenuNotFoundException::new);

        String oldImageUrl = menu.getImageUrl();

        menu.setImageUrl(null);

        Menu savedMenu =
                menuRepository.save(menu);

        /*
         * Delete physical file only after DB update.
         */
        deleteStoredImage(oldImageUrl);

        return savedMenu;
    }

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

    private String getExtension(String contentType) {

        if (contentType == null) {
            throw new IllegalArgumentException(
                    "Unsupported image type."
            );
        }

        return switch (
                contentType.toLowerCase(Locale.ROOT)
                ) {

            case "image/jpeg" -> ".jpg";

            case "image/png" -> ".png";

            case "image/webp" -> ".webp";

            case "image/gif" -> ".gif";

            default -> throw new IllegalArgumentException(
                    "Unsupported image type."
            );
        };
    }

    private void deleteStoredImage(String imageUrl) {

        if (
                imageUrl == null ||
                        imageUrl.isBlank()
        ) {
            return;
        }

        if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) {
            return;
        }

        String fileName =
                imageUrl.substring(
                        IMAGE_URL_PREFIX.length()
                );

        Path file =
                IMAGE_DIRECTORY
                        .resolve(fileName)
                        .normalize();

        if (!file.startsWith(IMAGE_DIRECTORY)) {
            return;
        }

        deleteFileQuietly(file);
    }

    private void deleteFileQuietly(Path file) {

        if (file == null) {
            return;
        }

        try {

            Files.deleteIfExists(file);

        } catch (IOException ignored) {

            /*
             * Database operation should remain functional
             * even if an old physical file cannot be deleted.
             */
        }
    }
}