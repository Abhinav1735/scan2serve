package com.scan2serve.repository;

import com.scan2serve.entity.Order;
import com.scan2serve.entity.Payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrder(
            Order order
    );

    boolean existsByOrder(
            Order order
    );
}