package com.scan2serve.repository;

import com.scan2serve.entity.Order;
import com.scan2serve.entity.OrderItem;
import com.scan2serve.enums.OrderItemStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {


    // =====================================================
    // FIND ALL ITEMS OF AN ORDER
    // =====================================================

    List<OrderItem> findByOrder(
            Order order
    );


    // =====================================================
    // FIND ONE ITEM BELONGING TO ONE ORDER
    // =====================================================

    Optional<OrderItem> findByIdAndOrder(
            Long id,
            Order order
    );


    // =====================================================
    // FIND SAME MENU ITEM IN SAME ORDER
    // =====================================================

    List<OrderItem> findByOrderAndMenuId(
            Order order,
            Long menuId
    );


    // =====================================================
    // FIND SAME MENU ITEM WITH SPECIFIC STATUS
    // =====================================================

    List<OrderItem> findByOrderAndMenuIdAndStatus(
            Order order,
            Long menuId,
            OrderItemStatus status
    );
}