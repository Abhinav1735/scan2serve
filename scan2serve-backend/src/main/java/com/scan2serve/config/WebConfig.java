package com.scan2serve.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {

        return new WebMvcConfigurer() {

            @Override
            public void addResourceHandlers(
                    ResourceHandlerRegistry registry
            ) {

                Path uploadPath =
                        Paths.get("uploads/menu-images")
                                .toAbsolutePath()
                                .normalize();

                registry
                        .addResourceHandler(
                                "/uploads/menu-images/**"
                        )
                        .addResourceLocations(
                                uploadPath.toUri().toString()
                        );
            }

            @Override
            public void addCorsMappings(
                    CorsRegistry registry
            ) {

                registry
                        .addMapping("/**")
                        .allowedOrigins(
                                "http://localhost:5500",
                                "http://127.0.0.1:5500"
                        )
                        .allowedMethods(
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "OPTIONS"
                        )
                        .allowedHeaders("*");
            }
        };
    }
}