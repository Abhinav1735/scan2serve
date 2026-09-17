package com.scan2serve.security;

import com.scan2serve.security.CustomUserDetailsService;
import com.scan2serve.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    /**
     * Main Spring Security configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

                // ---------------------------------------------------------
                // CORS
                // ---------------------------------------------------------
                // Required because the frontend is running on:
                // http://127.0.0.1:5500
                //
                // The browser sends an OPTIONS preflight request before
                // requests containing Authorization headers.
                // ---------------------------------------------------------
                .cors(cors -> cors
                        .configurationSource(corsConfigurationSource())
                )

                // ---------------------------------------------------------
                // CSRF
                // ---------------------------------------------------------
                // Disabled because this backend uses stateless JWT
                // authentication rather than cookie-based sessions.
                // ---------------------------------------------------------
                .csrf(csrf -> csrf.disable())

                // ---------------------------------------------------------
                // SESSION MANAGEMENT
                // ---------------------------------------------------------
                // JWT authentication is stateless.
                // ---------------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ---------------------------------------------------------
                // AUTHORIZATION
                // ---------------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // -------------------------------------------------
                        // IMPORTANT:
                        // Allow browser CORS preflight requests.
                        //
                        // Without this, Spring Security can return 403
                        // before the actual API request is reached.
                        // -------------------------------------------------
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // -------------------------------------------------
                        // Authentication
                        // -------------------------------------------------
                        .requestMatchers("/auth/**")
                        .permitAll()

                        // -------------------------------------------------
                        // Swagger / OpenAPI
                        // -------------------------------------------------
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // -------------------------------------------------
                        // ADMIN
                        // -------------------------------------------------
                        // ADMIN only:
                        //
                        // /admin/dashboard
                        // /admin/menu
                        // /admin/category
                        // /admin/tables
                        // /admin/orders
                        // /admin/employees
                        // etc.
                        // -------------------------------------------------
                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                        // -------------------------------------------------
                        // BILL DESK
                        // -------------------------------------------------
                        // ADMIN and BILL_DESK can access Bill Desk APIs.
                        // -------------------------------------------------
                        .requestMatchers("/bill-desk/**")
                        .hasAnyRole(
                                "ADMIN",
                                "BILL_DESK"
                        )

                        // -------------------------------------------------
                        // KITCHEN
                        // -------------------------------------------------
                        // ADMIN and KITCHEN can access Kitchen APIs.
                        // -------------------------------------------------
                        .requestMatchers("/kitchen/**")
                        .hasAnyRole(
                                "ADMIN",
                                "KITCHEN"
                        )

                        // -------------------------------------------------
                        // Remaining endpoints
                        // -------------------------------------------------
                        // Customer-facing APIs currently remain publicly
                        // accessible.
                        // -------------------------------------------------
                        .anyRequest()
                        .permitAll()
                )

                // ---------------------------------------------------------
                // JWT FILTER
                // ---------------------------------------------------------
                // Run JWT authentication before Spring's normal username/
                // password authentication filter.
                // ---------------------------------------------------------
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * Authentication provider used for employee username/password login.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    /**
     * AuthenticationManager used by AuthService during login.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {

        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * BCrypt password encoder.
     *
     * Employee passwords are stored as BCrypt hashes.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    /**
     * CORS configuration for the Scan2Serve frontend.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // -------------------------------------------------------------
        // FRONTEND ORIGINS
        // -------------------------------------------------------------
        // Your current frontend is running from:
        //
        // http://127.0.0.1:5500
        //
        // We also allow localhost because Live Server can be opened
        // using either hostname.
        // -------------------------------------------------------------
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5500",
                "http://127.0.0.1:5500"
        ));

        // -------------------------------------------------------------
        // HTTP METHODS
        // -------------------------------------------------------------
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));

        // -------------------------------------------------------------
        // REQUEST HEADERS
        // -------------------------------------------------------------
        // Authorization is required for JWT requests.
        // Content-Type is required for JSON and multipart requests.
        // -------------------------------------------------------------
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        // -------------------------------------------------------------
        // RESPONSE HEADERS
        // -------------------------------------------------------------
        // Content-Disposition is useful for QR/image downloads.
        // -------------------------------------------------------------
        configuration.setExposedHeaders(List.of(
                "Content-Disposition"
        ));

        // -------------------------------------------------------------
        // CREDENTIALS
        // -------------------------------------------------------------
        configuration.setAllowCredentials(true);

        // -------------------------------------------------------------
        // REGISTER CORS CONFIGURATION
        // -------------------------------------------------------------
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}