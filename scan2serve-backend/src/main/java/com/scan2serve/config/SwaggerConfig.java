package com.scan2serve.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI scan2ServeOpenAPI() {

        return new OpenAPI()

                .info(new Info()

                        .title("Scan2Serve API")

                        .description("QR Based Restaurant Ordering System")

                        .version("1.0")

                        .contact(new Contact()
                                .name("Abhinav Kumawat")
                                .email("abhinav@example.com"))

                        .license(new License()
                                .name("Apache 2.0")))

                .externalDocs(new ExternalDocumentation()
                        .description("Project Documentation"));
    }
}