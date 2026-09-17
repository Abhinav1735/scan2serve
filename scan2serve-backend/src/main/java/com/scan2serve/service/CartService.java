package com.scan2serve.service;

import com.scan2serve.dto.CartRequest;
import com.scan2serve.entity.Cart;
import com.scan2serve.entity.Menu;
import com.scan2serve.repository.CartRepository;
import com.scan2serve.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private MenuRepository menuRepository;


    // ==========================
    // Add Item To Cart
    // ==========================

    @Transactional
    public Cart addToCart(CartRequest request) {

        Menu menu = menuRepository.findById(request.getMenuId())
                .orElseThrow(() ->
                        new RuntimeException("Menu Not Found"));


        // Check if same menu already exists
        // in the same table's cart

        Optional<Cart> existingCart =
                cartRepository.findByTableNumberAndMenuId(
                        request.getTableNumber(),
                        request.getMenuId()
                );


        if (existingCart.isPresent()) {

            Cart cart = existingCart.get();

            // Increase quantity instead of
            // creating a new row

            cart.setQuantity(
                    cart.getQuantity() + request.getQuantity()
            );

            return cartRepository.save(cart);
        }


        // Create new cart item

        Cart cart = new Cart();

        cart.setTableNumber(
                request.getTableNumber()
        );

        cart.setMenu(menu);

        cart.setQuantity(
                request.getQuantity()
        );

        return cartRepository.save(cart);
    }


    // ==========================
    // Get Cart
    // ==========================

    public List<Cart> getCart(Integer tableNumber) {

        return cartRepository.findByTableNumber(
                tableNumber
        );
    }


    // ==========================
    // Update Cart Item Quantity
    // ==========================

    @Transactional
    public Cart updateQuantity(
            Long id,
            Integer quantity) {

        Cart cart = cartRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cart Item Not Found"
                        )
                );


        if (quantity == null || quantity <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than 0"
            );
        }


        cart.setQuantity(quantity);

        return cartRepository.save(cart);
    }


    // ==========================
    // Remove Single Cart Item
    // ==========================

    @Transactional
    public String removeItem(Long id) {

        try {

            if (!cartRepository.existsById(id)) {

                throw new RuntimeException(
                        "Cart Item Not Found"
                );
            }


            cartRepository.deleteById(id);

            return "Item Removed Successfully";


        } catch (EmptyResultDataAccessException e) {

            throw new RuntimeException(
                    "Cart Item Not Found"
            );
        }
    }


    // ==========================
    // Clear Complete Cart
    // ==========================

    @Transactional
    public String clearCart(Integer tableNumber) {

        List<Cart> cartItems =
                cartRepository.findByTableNumber(tableNumber);


        if (cartItems.isEmpty()) {

            throw new RuntimeException(
                    "Cart is Empty"
            );
        }


        cartRepository.deleteByTableNumber(
                tableNumber
        );


        return "Cart Cleared Successfully";
    }
}