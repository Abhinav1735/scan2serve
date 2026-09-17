package com.scan2serve.repository;


import com.scan2serve.entity.Order;
import com.scan2serve.enums.OrderStatus;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface OrderRepository
        extends JpaRepository<Order, Long> {


    // =====================================================
    // FIND ORDERS BY STATUS
    // =====================================================

    List<Order> findByStatus(
            OrderStatus status
    );


    // =====================================================
    // FIND ORDERS BY MULTIPLE STATUSES
    // =====================================================

    List<Order> findByStatusIn(
            List<OrderStatus> statuses
    );


    // =====================================================
    // FIND KITCHEN ORDERS THAT ARE NOT CLOSED
    // =====================================================

    List<Order> findByStatusInAndKitchenClosedFalseOrderByIdAsc(
            List<OrderStatus> statuses
    );


    // =====================================================
    // FIND ORDERS THAT ARE NOT CLOSED
    // =====================================================

    List<Order> findByStatusNotIn(
            List<OrderStatus> statuses
    );


    // =====================================================
    // FIND ACTIVE ORDER FOR TABLE
    // =====================================================

    Optional<Order>
    findFirstByTableNumberAndStatusNotInOrderByIdDesc(
            Integer tableNumber,
            List<OrderStatus> statuses
    );


    // =====================================================
    // BILL DESK - SEARCH OLD BILLS
    // =====================================================
    //
    // Old Bills / Recent Bills contains:
    //
    // 1. PAID orders
    // 2. CANCELLED orders
    //
    // Active orders are NOT included here.
    //
    // Filters:
    //
    // 1. Order ID
    // 2. Table Number
    // 3. Date
    //
    // Results are sorted newest first.
    //
    // =====================================================

    @Query("""
            SELECT o
            FROM Order o
            WHERE o.status IN :statuses

            AND (
                :orderId IS NULL
                OR o.id = :orderId
            )

            AND (
                :tableNumber IS NULL
                OR o.tableNumber = :tableNumber
            )

            AND (
                :startDateTime IS NULL
                OR o.orderTime >= :startDateTime
            )

            AND (
                :endDateTime IS NULL
                OR o.orderTime < :endDateTime
            )

            ORDER BY o.orderTime DESC
            """)
    List<Order> searchOldBills(

            @Param("statuses")
            List<OrderStatus> statuses,

            @Param("orderId")
            Long orderId,

            @Param("tableNumber")
            Integer tableNumber,

            @Param("startDateTime")
            LocalDateTime startDateTime,

            @Param("endDateTime")
            LocalDateTime endDateTime
    );
}