package com.scan2serve.security;

import com.scan2serve.security.CustomUserDetailsService;
import com.scan2serve.security.JwtAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
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

    /*
     * Frontend URL is supplied through environment variable:
     *
     * FRONTEND_URL=https://scan2servee.vercel.app
     *
     * Local development continues to use localhost by default.
     */
    @Value("${app.frontend.url:http://localhost:5500}")
    private String frontendUrl;

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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // ---------------------------------------------------------
                // CORS
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
                        // CORS PREFLIGHT
                        // -------------------------------------------------
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // -------------------------------------------------
                        // AUTHENTICATION
                        // -------------------------------------------------
                        .requestMatchers("/auth/**")
                        .permitAll()

                        // -------------------------------------------------
                        // SWAGGER / OPENAPI
                        // -------------------------------------------------
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // -------------------------------------------------
                        // ADMIN
                        // -------------------------------------------------
                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                        // -------------------------------------------------
                        // BILL DESK
                        // -------------------------------------------------
                        .requestMatchers("/bill-desk/**")
                        .hasAnyRole(
                                "ADMIN",
                                "BILL_DESK"
                        )

                        // -------------------------------------------------
                        // KITCHEN
                        // -------------------------------------------------
                        .requestMatchers("/kitchen/**")
                        .hasAnyRole(
                                "ADMIN",
                                "KITCHEN"
                        )

                        // -------------------------------------------------
                        // REMAINING ENDPOINTS
                        // -------------------------------------------------
                        .anyRequest()
                        .permitAll()
                )

                // ---------------------------------------------------------
                // JWT FILTER
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
        // Local development:
        // http://localhost:5500
        // http://127.0.0.1:5500
        //
        // Production:
        // https://scan2servee.vercel.app
        //
        // The production URL is read from:
        // FRONTEND_URL
        // -------------------------------------------------------------
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                frontendUrl
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