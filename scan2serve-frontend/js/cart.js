"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const BACKEND_URL = "https://scan2servee.onrender.com";

let gstPercentage = null;

/* =========================================================
   STATE
========================================================= */

let tableNumber = null;

let cartItems = [];

let customerDetails = null;

let pendingOrderRequest = false;

let toastTimeout = null;

/* =========================================================
   DOM REFERENCES
========================================================= */

const loading = document.getElementById("loading");

const errorState = document.getElementById("errorState");

const errorMessage = document.getElementById("errorMessage");

const emptyState = document.getElementById("emptyState");

const cartContent = document.getElementById("cartContent");

const cartItemsContainer = document.getElementById("cartItems");

const headerTableInfo = document.getElementById("headerTableInfo");

const itemCountLabel = document.getElementById("itemCountLabel");

const summaryItemCount = document.getElementById("summaryItemCount");

const summarySubtotal = document.getElementById("summarySubtotal");

const summaryGst = document.getElementById("summaryGst");

const summaryTotal = document.getElementById("summaryTotal");

const gstLabel = document.getElementById("gstLabel");

const headerOrderButton = document.getElementById("headerOrderButton");

const retryButton = document.getElementById("retryButton");

const emptyMenuButton = document.getElementById("emptyMenuButton");

const restaurantMenuButton = document.getElementById("restaurantMenuButton");

const continueShoppingButton = document.getElementById(
  "continueShoppingButton",
);

const placeOrderButton = document.getElementById("placeOrderButton");

/* =========================================================
   CUSTOMER DETAILS MODAL
========================================================= */

const customerDetailsModal = document.getElementById("customerDetailsModal");

const customerDetailsForm = document.getElementById("customerDetailsForm");

const closeCustomerDetailsButton = document.getElementById(
  "closeCustomerDetailsButton",
);

const cancelCustomerDetailsButton = document.getElementById(
  "cancelCustomerDetailsButton",
);

const customerNameInput = document.getElementById("customerName");

const customerPhoneInput = document.getElementById("customerPhone");

const customerNameError = document.getElementById("customerNameError");

const customerPhoneError = document.getElementById("customerPhoneError");

/* =========================================================
   ORDER CONFIRMATION MODAL
========================================================= */

const orderConfirmationModal = document.getElementById(
  "orderConfirmationModal",
);

const closeConfirmationButton = document.getElementById(
  "closeConfirmationButton",
);

const cancelOrderConfirmationButton = document.getElementById(
  "cancelOrderConfirmationButton",
);

const confirmPlaceOrderButton = document.getElementById(
  "confirmPlaceOrderButton",
);

const confirmationCustomerName = document.getElementById(
  "confirmationCustomerName",
);

const confirmationCustomerPhone = document.getElementById(
  "confirmationCustomerPhone",
);

const confirmationTableNumber = document.getElementById(
  "confirmationTableNumber",
);

const confirmationItemCount = document.getElementById("confirmationItemCount");

const confirmationSubtotal = document.getElementById("confirmationSubtotal");

const confirmationGst = document.getElementById("confirmationGst");

const confirmationGstLabel = document.getElementById("confirmationGstLabel");

const confirmationGrandTotal = document.getElementById(
  "confirmationGrandTotal",
);

/* =========================================================
   TOAST
========================================================= */

const cartToast = document.getElementById("cartToast");

const toastTitle = document.getElementById("toastTitle");

const toastMessage = document.getElementById("toastMessage");

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializeCart);

async function initializeCart() {
  tableNumber = getTableNumber();

  if (!tableNumber) {
    showError(
      "Table number is missing. Please scan the restaurant QR code again.",
    );

    return;
  }

  headerTableInfo.textContent = tableNumber;

  /*
   * Load the current GST percentage from
   * the public customer settings endpoint.
   */

  try {
    await loadGstPercentage();
  } catch (error) {
    showError(error.message || "Unable to load the current GST percentage.");

    return;
  }

  updateGstLabels();

  setupNavigation();

  loadSavedCustomerDetails();

  await loadCart();

  await checkCurrentOrder();
}

/* =========================================================
   GST
========================================================= */

async function loadGstPercentage() {
  try {
    const response = await fetch(`${BACKEND_URL}/customer/settings/gst`);

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Unable to load GST settings. Server returned ${response.status}.`,
      );
    }

    const value = Number(result?.data);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error("Invalid GST percentage received from server.");
    }

    gstPercentage = value;
  } catch (error) {
    console.error("GST settings error:", error);

    throw new Error(error.message || "Unable to load current GST percentage.");
  }
}

function updateGstLabels() {
  const rate = Number(gstPercentage);

  if (!Number.isFinite(rate)) {
    return;
  }

  const formattedRate = Number.isInteger(rate) ? String(rate) : rate.toFixed(2);

  if (gstLabel) {
    gstLabel.textContent = `GST (${formattedRate}%)`;
  }

  if (confirmationGstLabel) {
    confirmationGstLabel.textContent = `GST (${formattedRate}%)`;
  }
}

function calculateGst(subtotal) {
  if (!Number.isFinite(Number(gstPercentage))) {
    return 0;
  }

  return (Number(subtotal) * Number(gstPercentage)) / 100;
}

/* =========================================================
   TABLE NUMBER
========================================================= */

function getTableNumber() {
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
   NAVIGATION
========================================================= */

function setupNavigation() {
  const menuUrl = `menu.html?table=${encodeURIComponent(tableNumber)}`;

  /*
   * Empty-cart menu button.
   */

  if (emptyMenuButton) {
    emptyMenuButton.addEventListener("click", () => {
      window.location.href = menuUrl;
    });
  }

  /*
   * Main "Explore Our Menu"
   * button underneath Place Order.
   */

  if (restaurantMenuButton) {
    restaurantMenuButton.addEventListener("click", () => {
      window.location.href = menuUrl;
    });
  }

  /*
   * Compatibility with the existing
   * continue shopping element.
   */

  if (continueShoppingButton) {
    continueShoppingButton.addEventListener("click", () => {
      window.location.href = menuUrl;
    });
  }

  /*
   * Current Order.
   */

  if (headerOrderButton) {
    headerOrderButton.addEventListener("click", (event) => {
      event.preventDefault();

      openCurrentOrder();
    });
  }

  /*
   * Retry.
   */

  if (retryButton) {
    retryButton.addEventListener("click", loadCart);
  }

  /*
   * Place Order.
   */

  if (placeOrderButton) {
    placeOrderButton.addEventListener("click", handlePlaceOrderClick);
  }

  /*
   * Customer details.
   */

  if (customerDetailsForm) {
    customerDetailsForm.addEventListener("submit", handleCustomerDetailsSubmit);
  }

  if (customerPhoneInput) {
    customerPhoneInput.addEventListener("input", handlePhoneInput);
  }

  if (closeCustomerDetailsButton) {
    closeCustomerDetailsButton.addEventListener(
      "click",
      closeCustomerDetailsModal,
    );
  }

  if (cancelCustomerDetailsButton) {
    cancelCustomerDetailsButton.addEventListener(
      "click",
      closeCustomerDetailsModal,
    );
  }

  /*
   * Confirmation modal.
   */

  if (closeConfirmationButton) {
    closeConfirmationButton.addEventListener(
      "click",
      closeOrderConfirmationModal,
    );
  }

  if (cancelOrderConfirmationButton) {
    cancelOrderConfirmationButton.addEventListener(
      "click",
      closeOrderConfirmationModal,
    );
  }

  if (confirmPlaceOrderButton) {
    confirmPlaceOrderButton.addEventListener("click", confirmPlaceOrder);
  }

  /*
   * Escape key.
   */

  document.addEventListener("keydown", handleEscapeKey);
}

/* =========================================================
   LOAD CART
========================================================= */

async function loadCart() {
  showLoading();

  try {
    const response = await fetch(`${BACKEND_URL}/customer/cart/${tableNumber}`);

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Unable to load cart. Server returned ${response.status}.`,
      );
    }

    /*
     * Normal backend response:
     *
     * {
     *   success: true,
     *   message: "...",
     *   data: [...]
     * }
     */

    if (result && Array.isArray(result.data)) {
      cartItems = result.data;
    } else if (Array.isArray(result)) {
      /*
       * Defensive support for direct arrays.
       */

      cartItems = result;
    } else {
      cartItems = [];
    }

    renderCart();

    hideLoading();
  } catch (error) {
    console.error("Load cart error:", error);

    showError(error.message || "Unable to load your cart.");
  }
}

/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    showEmpty();

    return;
  }

  hideEmpty();

  cartItemsContainer.innerHTML = "";

  let totalQuantity = 0;

  let subtotal = 0;

  cartItems.forEach((item) => {
    const quantity = Number(item.quantity) || 0;

    const price = getItemPrice(item);

    const itemTotal = quantity * price;

    totalQuantity += quantity;

    subtotal += itemTotal;

    const cartItemElement = createCartItemElement(item);

    cartItemsContainer.appendChild(cartItemElement);
  });

  /*
   * GST.
   */

  const gst = calculateGst(subtotal);

  /*
   * Grand total.
   */

  const grandTotal = subtotal + gst;

  /*
   * Header item count.
   */

  itemCountLabel.textContent = `${totalQuantity} ${
    totalQuantity === 1 ? "item" : "items"
  }`;

  /*
   * Summary.
   */

  summaryItemCount.textContent = totalQuantity;

  summarySubtotal.textContent = formatMoney(subtotal);

  summaryGst.textContent = formatMoney(gst);

  summaryTotal.textContent = formatMoney(grandTotal);
}

/* =========================================================
   CREATE CART ITEM
========================================================= */

function createCartItemElement(item) {
  const card = document.createElement("article");

  card.className = "cart-item";

  /* -------------------------------------------------------
     IMAGE
  -------------------------------------------------------- */

  const imageWrapper = document.createElement("div");

  imageWrapper.className = "cart-item-image-wrapper";

  const image = document.createElement("img");

  image.className = "cart-item-image";

  image.alt = getItemName(item);

  const imageUrl =
    item?.menu?.imageUrl || item?.imageUrl || item?.menuImageUrl || "";

  if (imageUrl) {
    image.src = buildImageUrl(imageUrl);

    image.addEventListener("error", () => {
      image.remove();

      imageWrapper.classList.add("placeholder");

      imageWrapper.textContent = "🍽";
    });

    imageWrapper.appendChild(image);
  } else {
    imageWrapper.classList.add("placeholder");

    imageWrapper.textContent = "🍽";
  }

  /* -------------------------------------------------------
     INFORMATION
  -------------------------------------------------------- */

  const info = document.createElement("div");

  info.className = "cart-item-info";

  const name = document.createElement("h4");

  name.className = "cart-item-name";

  name.textContent = getItemName(item);

  const description = document.createElement("p");

  description.className = "cart-item-description";

  description.textContent = getItemDescription(item);

  const price = document.createElement("p");

  price.className = "cart-item-price";

  price.textContent = `₹${formatPlainMoney(getItemPrice(item))}`;

  info.appendChild(name);

  info.appendChild(description);

  info.appendChild(price);

  /* -------------------------------------------------------
     ACTIONS
  -------------------------------------------------------- */

  const actions = document.createElement("div");

  actions.className = "cart-item-actions";

  /* Quantity */

  const quantityControl = document.createElement("div");

  quantityControl.className = "cart-quantity-control";

  const minus = document.createElement("button");

  minus.type = "button";

  minus.className = "quantity-button";

  minus.textContent = "−";

  minus.setAttribute("aria-label", "Decrease quantity");

  const quantity = document.createElement("span");

  quantity.className = "quantity-value";

  quantity.textContent = item.quantity;

  const plus = document.createElement("button");

  plus.type = "button";

  plus.className = "quantity-button";

  plus.textContent = "+";

  plus.setAttribute("aria-label", "Increase quantity");

  minus.addEventListener("click", () => {
    updateCartQuantity(item.id, Number(item.quantity) - 1);
  });

  plus.addEventListener("click", () => {
    updateCartQuantity(item.id, Number(item.quantity) + 1);
  });

  quantityControl.appendChild(minus);

  quantityControl.appendChild(quantity);

  quantityControl.appendChild(plus);

  /* Total */

  const total = document.createElement("span");

  total.className = "cart-item-total";

  total.textContent = `₹${formatPlainMoney(
    getItemPrice(item) * Number(item.quantity),
  )}`;

  /* Remove */

  const remove = document.createElement("button");

  remove.type = "button";

  remove.className = "remove-item-button";

  remove.textContent = "×";

  remove.setAttribute("aria-label", "Remove item");

  remove.addEventListener("click", () => {
    removeCartItem(item.id);
  });

  actions.appendChild(quantityControl);

  actions.appendChild(total);

  actions.appendChild(remove);

  /* -------------------------------------------------------
     BUILD ITEM
  -------------------------------------------------------- */

  card.appendChild(imageWrapper);

  card.appendChild(info);

  card.appendChild(actions);

  return card;
}

/* =========================================================
   UPDATE QUANTITY
========================================================= */

async function updateCartQuantity(cartId, quantity) {
  if (!cartId) {
    return;
  }

  /*
   * If quantity becomes zero,
   * remove the item.
   */

  if (quantity <= 0) {
    await removeCartItem(cartId);

    return;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/customer/cart/${cartId}?quantity=${encodeURIComponent(
        quantity,
      )}`,
      {
        method: "PUT",
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || "Unable to update quantity.");
    }

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to update quantity.");
    }

    /*
     * Update only the affected item
     * in local state.
     */

    const item = cartItems.find((entry) => Number(entry.id) === Number(cartId));

    if (item) {
      item.quantity = quantity;
    }

    /*
     * Recalculate and update the UI.
     *
     * No page reload.
     */

    renderCart();
  } catch (error) {
    console.error("Quantity update error:", error);

    showToast("Unable to Update", error.message || "Please try again.");
  }
}

/* =========================================================
   REMOVE ITEM
========================================================= */

async function removeCartItem(cartId) {
  if (!cartId) {
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/customer/cart/${cartId}`, {
      method: "DELETE",
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || "Unable to remove item.");
    }

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to remove item.");
    }

    /*
     * Remove only this item
     * from local state.
     */

    cartItems = cartItems.filter((item) => Number(item.id) !== Number(cartId));

    renderCart();

    showToast("Item Removed", "The dish was removed from your cart.");
  } catch (error) {
    console.error("Remove item error:", error);

    showToast("Unable to Remove", error.message || "Please try again.");
  }
}

/* =========================================================
   PLACE ORDER CLICK
========================================================= */

function handlePlaceOrderClick() {
  if (pendingOrderRequest) {
    return;
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    showToast("Cart Empty", "Please add dishes before placing your order.");

    return;
  }

  /*
   * FIRST ORDER:
   *
   * Ask name + phone.
   */

  if (!customerDetails) {
    openCustomerDetailsModal();

    return;
  }

  /*
   * SUBSEQUENT ORDER:
   *
   * Use saved details.
   */

  openOrderConfirmationModal();
}

/* =========================================================
   CUSTOMER DETAILS MODAL
========================================================= */

function openCustomerDetailsModal() {
  clearCustomerErrors();

  if (customerNameInput) {
    customerNameInput.value = customerDetails?.name || "";
  }

  if (customerPhoneInput) {
    customerPhoneInput.value = customerDetails?.phone || "";
  }

  customerDetailsModal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

  setTimeout(() => {
    if (customerNameInput) {
      customerNameInput.focus();
    }
  }, 50);
}

function closeCustomerDetailsModal() {
  customerDetailsModal.classList.add("hidden");

  document.body.style.overflow = "";
}

/* =========================================================
   CUSTOMER FORM
========================================================= */

function handleCustomerDetailsSubmit(event) {
  event.preventDefault();

  clearCustomerErrors();

  const name = customerNameInput.value.trim();

  const phone = customerPhoneInput.value.replace(/\D/g, "");

  let valid = true;

  /*
   * Name validation.
   */

  if (!name || name.length < 2) {
    showFieldError(
      customerNameInput,
      customerNameError,
      "Please enter your name.",
    );

    valid = false;
  }

  if (name.length > 100) {
    showFieldError(
      customerNameInput,
      customerNameError,
      "Name cannot exceed 100 characters.",
    );

    valid = false;
  }

  /*
   * Phone validation.
   */

  if (!isValidPhone(phone)) {
    showFieldError(
      customerPhoneInput,
      customerPhoneError,
      "Enter a valid 10-digit mobile number.",
    );

    valid = false;
  }

  if (!valid) {
    return;
  }

  /*
   * Store customer details.
   */

  customerDetails = {
    name,
    phone,
  };

  /*
   * Save locally so subsequent
   * orders do not ask again.
   */

  saveCustomerDetails(customerDetails);

  closeCustomerDetailsModal();

  /*
   * Continue to confirmation.
   */

  openOrderConfirmationModal();
}

/* =========================================================
   PHONE INPUT
========================================================= */

function handlePhoneInput(event) {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone));
}

/* =========================================================
   CUSTOMER ERRORS
========================================================= */

function showFieldError(input, errorElement, message) {
  input.classList.add("invalid");

  errorElement.textContent = message;

  errorElement.classList.remove("hidden");
}

function clearCustomerErrors() {
  if (customerNameInput) {
    customerNameInput.classList.remove("invalid");
  }

  if (customerPhoneInput) {
    customerPhoneInput.classList.remove("invalid");
  }

  if (customerNameError) {
    customerNameError.textContent = "";

    customerNameError.classList.add("hidden");
  }

  if (customerPhoneError) {
    customerPhoneError.textContent = "";

    customerPhoneError.classList.add("hidden");
  }
}

/* =========================================================
   CUSTOMER STORAGE
========================================================= */

function getCustomerStorageKey() {
  return "scan2serve_customer_" + String(tableNumber);
}

function saveCustomerDetails(details) {
  try {
    localStorage.setItem(getCustomerStorageKey(), JSON.stringify(details));
  } catch (error) {
    console.warn("Could not save customer details:", error);
  }
}

function loadSavedCustomerDetails() {
  try {
    const raw = localStorage.getItem(getCustomerStorageKey());

    if (!raw) {
      return;
    }

    const details = JSON.parse(raw);

    if (
      details &&
      typeof details.name === "string" &&
      isValidPhone(String(details.phone))
    ) {
      customerDetails = {
        name: details.name.trim(),

        phone: String(details.phone),
      };
    }
  } catch (error) {
    console.warn("Could not load customer details:", error);
  }
}

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function openOrderConfirmationModal() {
  if (!customerDetails) {
    openCustomerDetailsModal();

    return;
  }

  let totalQuantity = 0;

  let subtotal = 0;

  cartItems.forEach((item) => {
    const quantity = Number(item.quantity) || 0;

    const price = getItemPrice(item);

    totalQuantity += quantity;

    subtotal += quantity * price;
  });

  const gst = calculateGst(subtotal);

  const grandTotal = subtotal + gst;

  updateGstLabels();

  confirmationCustomerName.textContent = customerDetails.name;

  confirmationCustomerPhone.textContent = customerDetails.phone;

  confirmationTableNumber.textContent = tableNumber;

  confirmationItemCount.textContent = totalQuantity;

  confirmationSubtotal.textContent = formatMoney(subtotal);

  confirmationGst.textContent = formatMoney(gst);

  confirmationGrandTotal.textContent = formatMoney(grandTotal);

  orderConfirmationModal.classList.remove("hidden");

  document.body.style.overflow = "hidden";
}

function closeOrderConfirmationModal() {
  orderConfirmationModal.classList.add("hidden");

  document.body.style.overflow = "";
}

/* =========================================================
   CONFIRM PLACE ORDER
========================================================= */

async function confirmPlaceOrder() {
  if (pendingOrderRequest) {
    return;
  }

  if (!customerDetails) {
    closeOrderConfirmationModal();

    openCustomerDetailsModal();

    return;
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    closeOrderConfirmationModal();

    showToast("Cart Empty", "Please add dishes before placing your order.");

    return;
  }

  pendingOrderRequest = true;

  confirmPlaceOrderButton.disabled = true;

  confirmPlaceOrderButton.textContent = "Placing Order...";

  try {
    /*
     * Current backend expects:
     *
     * tableNumber
     * customerName
     * customerPhone
     *
     * GST is intentionally NOT sent here.
     * The backend gets the current GST setting
     * and stores it with the new order.
     */

    const response = await fetch(`${BACKEND_URL}/customer/order`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tableNumber: Number(tableNumber),

        customerName: customerDetails.name,

        customerPhone: customerDetails.phone,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Unable to place order. Server returned ${response.status}.`,
      );
    }

    if (!result || result.success !== true) {
      throw new Error(result?.message || "Unable to place order.");
    }

    const order = result.data;

    const orderId = order?.id;

    if (!orderId) {
      throw new Error("Order was created but Order ID was not returned.");
    }

    /*
     * Save current order.
     */

    localStorage.setItem(getCurrentOrderStorageKey(), String(orderId));

    /*
     * Save customer details.
     */

    saveCustomerDetails(customerDetails);

    closeOrderConfirmationModal();

    showToast("Order Placed", "Your order has been sent to the restaurant.");

    /*
     * Open bill.
     */

    setTimeout(() => {
      window.location.href = `bill.html?orderId=${encodeURIComponent(
        orderId,
      )}&table=${encodeURIComponent(tableNumber)}&orderPlaced=true`;
    }, 500);
  } catch (error) {
    console.error("Place order error:", error);

    showToast("Unable to Place Order", error.message || "Please try again.");

    confirmPlaceOrderButton.disabled = false;

    confirmPlaceOrderButton.textContent = "Place Order";
  } finally {
    pendingOrderRequest = false;
  }
}

/* =========================================================
   CURRENT ORDER CHECK
========================================================= */

async function checkCurrentOrder() {
  if (!headerOrderButton) {
    return;
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/customer/order/current/${tableNumber}`,
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      headerOrderButton.classList.add("hidden");

      return;
    }

    const order = result?.data;

    if (result?.success === true && order?.id) {
      headerOrderButton.classList.remove("hidden");

      headerOrderButton.href = `bill.html?orderId=${encodeURIComponent(
        order.id,
      )}&table=${encodeURIComponent(tableNumber)}`;
    } else {
      headerOrderButton.classList.add("hidden");
    }
  } catch (error) {
    console.warn("Could not check current order:", error);

    headerOrderButton.classList.add("hidden");
  }
}

/* =========================================================
   OPEN CURRENT ORDER
========================================================= */

async function openCurrentOrder() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/customer/order/current/${tableNumber}`,
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || "Unable to find current order.");
    }

    const order = result?.data;

    if (!result?.success || !order?.id) {
      showToast("No Current Order", "There is no active order for this table.");

      return;
    }

    window.location.href = `bill.html?orderId=${encodeURIComponent(
      order.id,
    )}&table=${encodeURIComponent(tableNumber)}`;
  } catch (error) {
    console.error("Current order error:", error);

    showToast("Unable to Open Order", error.message || "Please try again.");
  }
}

/* =========================================================
   CURRENT ORDER STORAGE
========================================================= */

function getCurrentOrderStorageKey() {
  return "scan2serve_current_order_" + String(tableNumber);
}

/* =========================================================
   IMAGE URL
========================================================= */

function buildImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return BACKEND_URL + imageUrl;
  }

  return BACKEND_URL + "/" + imageUrl;
}

/* =========================================================
   ITEM HELPERS
========================================================= */

function getItemName(item) {
  return (
    item?.menu?.name ||
    item?.menuName ||
    item?.itemName ||
    item?.name ||
    "Menu Item"
  );
}

function getItemDescription(item) {
  return (
    item?.menu?.description ||
    item?.description ||
    "Deliciously prepared for you."
  );
}

function getItemPrice(item) {
  return Number(
    item?.menu?.price ?? item?.menuPrice ?? item?.unitPrice ?? item?.price ?? 0,
  );
}

/* =========================================================
   MONEY
========================================================= */

function formatPlainMoney(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);
}

function formatMoney(amount) {
  return "₹" + formatPlainMoney(amount);
}

/* =========================================================
   LOADING
========================================================= */

function showLoading() {
  loading.classList.remove("hidden");

  errorState.classList.add("hidden");

  emptyState.classList.add("hidden");

  cartContent.classList.add("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

/* =========================================================
   EMPTY
========================================================= */

function showEmpty() {
  hideLoading();

  errorState.classList.add("hidden");

  emptyState.classList.remove("hidden");

  cartContent.classList.add("hidden");
}

function hideEmpty() {
  emptyState.classList.add("hidden");

  cartContent.classList.remove("hidden");
}

/* =========================================================
   ERROR
========================================================= */

function showError(message) {
  hideLoading();

  emptyState.classList.add("hidden");

  cartContent.classList.add("hidden");

  errorState.classList.remove("hidden");

  errorMessage.textContent = message || "Something went wrong.";
}

/* =========================================================
   TOAST
========================================================= */

function showToast(title, message) {
  toastTitle.textContent = title || "";

  toastMessage.textContent = message || "";

  cartToast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    cartToast.classList.remove("show");
  }, 3200);
}

/* =========================================================
   ESCAPE KEY
========================================================= */

function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (!customerDetailsModal.classList.contains("hidden")) {
    closeCustomerDetailsModal();

    return;
  }

  if (!orderConfirmationModal.classList.contains("hidden")) {
    closeOrderConfirmationModal();
  }
}
