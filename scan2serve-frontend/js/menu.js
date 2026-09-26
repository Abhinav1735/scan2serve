"use strict";

/* =========================================================
   SCAN2SERVE - CUSTOMER MENU
========================================================= */

/* =========================================================
   BACKEND
========================================================= */

const BACKEND_URL = "https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run";

/* =========================================================
   STATE
========================================================= */

let tableNumber = null;

let menuData = [];

let cartItems = [];

let toastTimeout = null;

let hasActiveOrder = false;

let activeOrderId = null;

/* =========================================================
   DOM ELEMENTS
========================================================= */

const menuContainer = document.getElementById("menuContainer");

const menuLoading = document.getElementById("menuLoading");

const menuError = document.getElementById("menuError");

const menuErrorMessage = document.getElementById("menuErrorMessage");

const menuEmpty = document.getElementById("menuEmpty");

const retryMenuButton = document.getElementById("retryMenuButton");

const tableNumberDisplay = document.getElementById("tableNumberDisplay");

const cartButton = document.getElementById("cartButton");

const cartCount = document.getElementById("cartCount");

const currentOrderButton = document.getElementById("currentOrderButton");

const cartToast = document.getElementById("cartToast");

const toastTitle = document.getElementById("toastTitle");

const toastMessage = document.getElementById("toastMessage");

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializeMenu);

async function initializeMenu() {
  tableNumber = getTableNumberFromUrl();

  /*
     Table is required.
  */

  if (!tableNumber) {
    showMenuError(
      "Table number is missing. Please scan the table QR code again.",
    );

    return;
  }

  /*
     Display table number.
  */

  if (tableNumberDisplay) {
    tableNumberDisplay.textContent = tableNumber;
  }

  /*
     Current Order must start hidden.
  */

  hideCurrentOrderButton();

  /*
     Setup events.
  */

  setupEventListeners();

  /*
     Load menu.
  */

  await loadMenu();

  /*
     Load cart quantity.
  */

  await refreshCartCount();

  /*
     Check existing order.
  */

  await checkCurrentOrder();
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {
  /*
     Retry.
  */

  if (retryMenuButton) {
    retryMenuButton.addEventListener("click", async () => {
      await loadMenu();
    });
  }

  /*
     Cart.
  */

  if (cartButton) {
    cartButton.addEventListener("click", openCart);
  }

  /*
     Current order.
  */

  if (currentOrderButton) {
    currentOrderButton.addEventListener("click", openCurrentOrder);
  }

  /*
     Menu buttons.

     Event delegation is used because
     menu cards are generated dynamically.
  */

  if (menuContainer) {
    menuContainer.addEventListener("click", handleMenuClick);
  }
}

/* =========================================================
   TABLE NUMBER
========================================================= */

function getTableNumberFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const value = params.get("table");

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

/* =========================================================
   LOAD MENU
========================================================= */

async function loadMenu() {
  showMenuLoading();

  try {
    const response = await fetch(`${BACKEND_URL}/customer/menu`);

    if (!response.ok) {
      throw new Error(
        `Unable to load menu. Server returned ${response.status}.`,
      );
    }

    const result = await response.json();

    /*
       Backend normally returns:

       [
         {
           category: "Drinks",
           items: [...]
         }
       ]

       Also support:

       {
         data: [...]
       }
    */

    if (Array.isArray(result)) {
      menuData = result;
    } else if (result && Array.isArray(result.data)) {
      menuData = result.data;
    } else {
      menuData = [];
    }

    hideMenuLoading();

    if (!Array.isArray(menuData) || menuData.length === 0) {
      showMenuEmpty();

      return;
    }

    renderMenu();
  } catch (error) {
    console.error("Menu loading error:", error);

    showMenuError(error.message || "Unable to load the restaurant menu.");
  }
}

/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu() {
  if (!menuContainer) {
    return;
  }

  /*
     Clear only the menu.

     Header remains untouched.
  */

  menuContainer.innerHTML = "";

  let renderedCategories = 0;

  /*
     IMPORTANT:

     DO NOT SORT.

     Backend already returns categories
     according to admin display order.
  */

  menuData.forEach((categoryData) => {
    if (
      !categoryData ||
      !Array.isArray(categoryData.items) ||
      categoryData.items.length === 0
    ) {
      return;
    }

    const categoryElement = createCategoryElement(categoryData);

    menuContainer.appendChild(categoryElement);

    renderedCategories++;
  });

  if (renderedCategories === 0) {
    showMenuEmpty();

    return;
  }

  menuContainer.classList.remove("hidden");
}

/* =========================================================
   CREATE CATEGORY
========================================================= */

function createCategoryElement(categoryData) {
  const categorySection = document.createElement("section");

  categorySection.className = "menu-category";

  const categoryName = categoryData.category || "Menu";

  const items = Array.isArray(categoryData.items) ? categoryData.items : [];

  /*
     No item count is displayed.
  */

  categorySection.innerHTML = `

    <div class="category-header">

      <div class="category-title-wrapper">

        <span class="category-marker"></span>

        <h3>
          ${escapeHtml(categoryName)}
        </h3>

      </div>

    </div>


    <div class="menu-grid"></div>

  `;

  const grid = categorySection.querySelector(".menu-grid");

  items.forEach((item) => {
    const card = createMenuItemCard(item);

    grid.appendChild(card);
  });

  return categorySection;
}

/* =========================================================
   CREATE MENU ITEM CARD
========================================================= */

function createMenuItemCard(item) {
  const card = document.createElement("article");

  card.className = "menu-item-card";

  /*
     Item ID.
  */

  const itemId = Number(item?.id);

  /*
     Item information.
  */

  const itemName = item?.name || "Unnamed Item";

  const description = item?.description || "Deliciously prepared for you.";

  const price = Number(item?.price || 0);

  /*
     IMPORTANT IMAGE FIX

     Convert backend-relative image
     path into a full backend URL.
  */

  const rawImageUrl = item?.imageUrl || "";

  const imageUrl = buildImageUrl(rawImageUrl);

  card.dataset.menuId = String(itemId);

  /*
     Image HTML.

     If imageUrl exists, load actual image.

     If it fails, replace it with
     the restaurant-style placeholder.
  */

  const imageHtml = imageUrl
    ? `

        <img
          class="menu-item-image"
          src="${escapeAttribute(imageUrl)}"
          alt="${escapeAttribute(itemName)}"
          loading="lazy"
          decoding="async"
        >

      `
    : `

        <div
          class="image-placeholder"
          aria-label="Food image unavailable"
        >
          🍽
        </div>

      `;

  card.innerHTML = `

    <!-- FOOD IMAGE -->

    <div class="menu-item-image-wrapper">

      ${imageHtml}

    </div>


    <!-- FOOD DETAILS -->

    <div class="menu-item-body">

      <h4 class="menu-item-name">
        ${escapeHtml(itemName)}
      </h4>


      <p class="menu-item-description">
        ${escapeHtml(description)}
      </p>


      <div class="menu-item-bottom">

        <div class="menu-item-price">
          ₹${formatMoney(price)}
        </div>


        <div class="item-action-row">

          <!-- QUANTITY -->

          <div
            class="quantity-control"
            aria-label="Quantity selector"
          >

            <button
              type="button"
              class="quantity-button quantity-minus"
              data-action="decrease"
              data-menu-id="${itemId}"
              aria-label="Decrease quantity"
            >
              −
            </button>


            <span
              class="quantity-value"
              data-quantity-for="${itemId}"
            >
              1
            </span>


            <button
              type="button"
              class="quantity-button quantity-plus"
              data-action="increase"
              data-menu-id="${itemId}"
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>


          <!-- ADD TO CART -->

          <button
            type="button"
            class="add-cart-button"
            data-action="add"
            data-menu-id="${itemId}"
          >
            Add to Cart
          </button>

        </div>

      </div>

    </div>

  `;

  /*
     Broken image fallback.

     If the URL is still invalid,
     replace it with the placeholder.
  */

  const image = card.querySelector(".menu-item-image");

  if (image) {
    image.addEventListener("error", () => {
      console.warn("Menu image failed to load:", image.src);

      const wrapper = image.parentElement;

      image.remove();

      const placeholder = document.createElement("div");

      placeholder.className = "image-placeholder";

      placeholder.setAttribute("aria-label", "Food image unavailable");

      placeholder.textContent = "🍽";

      wrapper.appendChild(placeholder);
    });
  }

  return card;
}

/* =========================================================
   IMAGE URL BUILDER
========================================================= */

/*
   This is the main fix for your image problem.

   Examples:

   "/uploads/menu-images/a.jpg"
       ↓
   https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run/uploads/menu-images/a.jpg


   "uploads/menu-images/a.jpg"
       ↓
   https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run/uploads/menu-images/a.jpg


   https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run/uploads/menu-images/a.jpg
       ↓
   unchanged


   "https://example.com/a.jpg"
       ↓
   unchanged
*/

function buildImageUrl(imageUrl) {
  if (imageUrl === null || imageUrl === undefined) {
    return "";
  }

  const value = String(imageUrl).trim();

  if (!value) {
    return "";
  }

  /*
     Already a complete URL.
  */

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  /*
     Protocol-relative URL.
  */

  if (value.startsWith("//")) {
    return window.location.protocol + value;
  }

  /*
     Backend-relative path.

     Example:

     /uploads/menu-images/foo.jpg
  */

  if (value.startsWith("/")) {
    return BACKEND_URL + value;
  }

  /*
     Relative path without slash.

     Example:

     uploads/menu-images/foo.jpg
  */

  return BACKEND_URL + "/" + value;
}

/* =========================================================
   MENU CLICK
========================================================= */

async function handleMenuClick(event) {
  const target = event.target.closest("button");

  if (!target) {
    return;
  }

  const menuId = Number(target.dataset.menuId);

  if (!Number.isInteger(menuId) || menuId <= 0) {
    return;
  }

  const action = target.dataset.action;

  if (action === "increase") {
    changeQuantity(menuId, 1);

    return;
  }

  if (action === "decrease") {
    changeQuantity(menuId, -1);

    return;
  }

  if (action === "add") {
    await addToCart(menuId);
  }
}

/* =========================================================
   QUANTITY ELEMENT
========================================================= */

function getQuantityElement(menuId) {
  return document.querySelector(`[data-quantity-for="${menuId}"]`);
}

/* =========================================================
   GET QUANTITY
========================================================= */

function getQuantity(menuId) {
  const element = getQuantityElement(menuId);

  if (!element) {
    return 1;
  }

  const quantity = Number(element.textContent);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 1;
  }

  return quantity;
}

/* =========================================================
   SET QUANTITY
========================================================= */

function setQuantity(menuId, quantity) {
  const element = getQuantityElement(menuId);

  if (!element) {
    return;
  }

  const safeQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));

  element.textContent = safeQuantity;
}

/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQuantity(menuId, difference) {
  const current = getQuantity(menuId);

  setQuantity(menuId, current + difference);
}

/* =========================================================
   ADD TO CART
========================================================= */

async function addToCart(menuId) {
  if (!tableNumber) {
    showToast("Unable to Add", "Table number is missing.");

    return;
  }

  const quantity = getQuantity(menuId);

  const button = document.querySelector(
    `.add-cart-button[data-menu-id="${menuId}"]`,
  );

  if (button) {
    button.disabled = true;

    button.textContent = "Adding...";
  }

  try {
    const response = await fetch(`${BACKEND_URL}/customer/cart`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tableNumber: Number(tableNumber),

        menuId: Number(menuId),

        quantity: Number(quantity),
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Unable to add item. Server returned ${response.status}.`,
      );
    }

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to add item to cart.");
    }

    /*
       Refresh cart badge.
    */

    await refreshCartCount();

    /*
       Get item name.
    */

    const item = findMenuItem(menuId);

    const itemName = item?.name || "Item";

    showToast("Added to Cart", `${itemName} × ${quantity} added successfully.`);

    /*
       Reset selector.
    */

    setQuantity(menuId, 1);
  } catch (error) {
    console.error("Add to cart error:", error);

    showToast("Unable to Add", error.message || "Please try again.");
  } finally {
    if (button) {
      button.disabled = false;

      button.textContent = "Add to Cart";
    }
  }
}

/* =========================================================
   FIND MENU ITEM
========================================================= */

function findMenuItem(menuId) {
  for (const category of menuData) {
    if (!category || !Array.isArray(category.items)) {
      continue;
    }

    const item = category.items.find(
      (value) => Number(value?.id) === Number(menuId),
    );

    if (item) {
      return item;
    }
  }

  return null;
}

/* =========================================================
   CART COUNT
========================================================= */

async function refreshCartCount() {
  if (!tableNumber) {
    return;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/customer/cart/${encodeURIComponent(tableNumber)}`,
    );

    if (!response.ok) {
      return;
    }

    const result = await response.json();

    let data = [];

    if (Array.isArray(result)) {
      data = result;
    } else if (result && Array.isArray(result.data)) {
      data = result.data;
    }

    cartItems = Array.isArray(data) ? data : [];

    const totalQuantity = cartItems.reduce(
      (total, item) => total + Number(item?.quantity || 0),
      0,
    );

    updateCartCount(totalQuantity);
  } catch (error) {
    console.warn("Unable to refresh cart count:", error);
  }
}

/* =========================================================
   CART COUNT UI
========================================================= */

function updateCartCount(count) {
  const safeCount = Math.max(0, Number(count) || 0);

  if (!cartCount) {
    return;
  }

  if (safeCount === 0) {
    cartCount.textContent = "0";

    cartCount.classList.add("hidden");

    return;
  }

  cartCount.textContent = safeCount > 99 ? "99+" : String(safeCount);

  cartCount.classList.remove("hidden");
}

/* =========================================================
   CURRENT ORDER
========================================================= */

async function checkCurrentOrder() {
  hasActiveOrder = false;

  activeOrderId = null;

  /*
     Always start hidden.
  */

  hideCurrentOrderButton();

  if (!tableNumber) {
    return;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/customer/order/current/${encodeURIComponent(
        tableNumber,
      )}`,
    );

    /*
       Backend failure means
       keep Current Order hidden.
    */

    if (!response.ok) {
      hideCurrentOrderButton();

      return;
    }

    const result = await response.json().catch(() => null);

    /*
       Backend normally returns:

       {
         success: true,
         message: "...",
         data: {
           id: 123,
           ...
         }
       }
    */

    const order = result?.data || (result && result.id ? result : null);

    /*
       Only show Current Order
       when an actual order ID exists.
    */

    if (order && order.id !== null && order.id !== undefined) {
      hasActiveOrder = true;

      activeOrderId = order.id;

      showCurrentOrderButton();
    } else {
      hasActiveOrder = false;

      activeOrderId = null;

      hideCurrentOrderButton();
    }
  } catch (error) {
    console.warn("Current order check failed:", error);

    hasActiveOrder = false;

    activeOrderId = null;

    hideCurrentOrderButton();
  }
}

/* =========================================================
   SHOW CURRENT ORDER
========================================================= */

function showCurrentOrderButton() {
  if (!currentOrderButton) {
    return;
  }

  currentOrderButton.classList.remove("hidden");
}

/* =========================================================
   HIDE CURRENT ORDER
========================================================= */

function hideCurrentOrderButton() {
  if (!currentOrderButton) {
    return;
  }

  currentOrderButton.classList.add("hidden");
}

/* =========================================================
   OPEN CART
========================================================= */

function openCart() {
  if (!tableNumber) {
    showToast("Unable to Open Cart", "Table number is missing.");

    return;
  }

  window.location.href = `cart.html?table=${encodeURIComponent(tableNumber)}`;
}

/* =========================================================
   OPEN CURRENT ORDER
========================================================= */

function openCurrentOrder() {
  /*
     Never navigate to bill without
     a real order ID.
  */

  if (
    !tableNumber ||
    !hasActiveOrder ||
    activeOrderId === null ||
    activeOrderId === undefined
  ) {
    console.warn("Cannot open current order: no active order ID.");

    return;
  }

  window.location.href = `bill.html?orderId=${encodeURIComponent(
    activeOrderId,
  )}&table=${encodeURIComponent(tableNumber)}`;
}

/* =========================================================
   LOADING
========================================================= */

function showMenuLoading() {
  if (menuLoading) {
    menuLoading.classList.remove("hidden");
  }

  if (menuError) {
    menuError.classList.add("hidden");
  }

  if (menuEmpty) {
    menuEmpty.classList.add("hidden");
  }

  if (menuContainer) {
    menuContainer.classList.add("hidden");
  }
}

/* =========================================================
   HIDE LOADING
========================================================= */

function hideMenuLoading() {
  if (menuLoading) {
    menuLoading.classList.add("hidden");
  }
}

/* =========================================================
   EMPTY
========================================================= */

function showMenuEmpty() {
  hideMenuLoading();

  if (menuError) {
    menuError.classList.add("hidden");
  }

  if (menuContainer) {
    menuContainer.classList.add("hidden");
  }

  if (menuEmpty) {
    menuEmpty.classList.remove("hidden");
  }
}

/* =========================================================
   ERROR
========================================================= */

function showMenuError(message) {
  if (menuLoading) {
    menuLoading.classList.add("hidden");
  }

  if (menuEmpty) {
    menuEmpty.classList.add("hidden");
  }

  if (menuContainer) {
    menuContainer.classList.add("hidden");
  }

  if (menuErrorMessage) {
    menuErrorMessage.textContent = message;
  }

  if (menuError) {
    menuError.classList.remove("hidden");
  }
}

/* =========================================================
   TOAST
========================================================= */

function showToast(title, message) {
  if (!cartToast || !toastTitle || !toastMessage) {
    return;
  }

  toastTitle.textContent = title;

  toastMessage.textContent = message;

  cartToast.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    cartToast.classList.remove("show");
  }, 2600);
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toFixed(2);
}

/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   ATTRIBUTE ESCAPING
========================================================= */

function escapeAttribute(value) {
  return escapeHtml(value);
}
