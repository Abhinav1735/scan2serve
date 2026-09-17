package com.scan2serve.repository;

import com.scan2serve.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    List<Cart> findByTableNumber(Integer tableNumber);

    Optional<Cart> findByTableNumberAndMenuId(Integer tableNumber, Long menuId);

    @Modifying
    void deleteByTableNumber(Integer tableNumber);
}