"use strict";

/* =========================================================
   SCAN2SERVE - ADMIN NATIVE KITCHEN
   ========================================================= */

/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADMIN_KITCHEN_API_BASE_URL = "http://localhost:8080";

const ADMIN_KITCHEN_TOKEN_KEY = "scan2serve_token";

/* =========================================================
   STATE
   ========================================================= */

let adminKitchenOrders = [];

let adminKitchenRefreshTimer = null;

let adminKitchenInitialized = false;

let adminKitchenLoading = false;

/* =========================================================
   DOM HELPER
   ========================================================= */

function adminKitchen$(id) {
  return document.getElementById(id);
}

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function adminKitchenEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return characters[character];
  });
}

function adminKitchenNormalizeStatus(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toUpperCase();
}

function adminKitchenNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function adminKitchenMoney(value) {
  return `₹${adminKitchenNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================
   DATE / TIME
   ========================================================= */

function adminKitchenFormatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   STATUS
   ========================================================= */

function adminKitchenFormatStatus(status) {
  const normalized = adminKitchenNormalizeStatus(status);

  if (normalized === "ORDER_PLACED") {
    return "New";
  }

  if (normalized === "PENDING") {
    return "Pending";
  }

  if (normalized === "PREPARING") {
    return "Preparing";
  }

  if (normalized === "READY") {
    return "Ready";
  }

  if (normalized === "SERVED") {
    return "Served";
  }

  if (normalized === "CANCELLED") {
    return "Cancelled";
  }

  if (normalized === "PAID") {
    return "Paid";
  }

  if (normalized === "CLOSED") {
    return "Closed";
  }

  return status || "Unknown";
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function adminKitchenGetErrorMessage(
  error,
  fallback = "Something went wrong.",
) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

/* =========================================================
   TOAST
   ========================================================= */

function adminKitchenToast(title, message, type = "info") {
  if (typeof window.showToast === "function") {
    window.showToast(title, message, type);
    return;
  }

  console.log(`[${type}] ${title}: ${message}`);
}

/* =========================================================
   AUTHENTICATED API
   ========================================================= */

async function adminKitchenApi(endpoint, options = {}) {
  const token = localStorage.getItem(ADMIN_KITCHEN_TOKEN_KEY);

  if (!token) {
    throw new Error("Your Admin session has expired. Please login again.");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  /*
   * JSON body.
   */
  if (
    options.body &&
    typeof options.body !== "string" &&
    !(options.body instanceof FormData)
  ) {
    options = {
      ...options,
      body: JSON.stringify(options.body),
    };
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${ADMIN_KITCHEN_API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to Scan2Serve backend. Make sure the Spring Boot server is running on port 8080.",
    );
  }

  /*
   * Session expired.
   */
  if (response.status === 401) {
    throw new Error("Your Admin session has expired. Please login again.");
  }

  /*
   * Permission problem.
   */
  if (response.status === 403) {
    throw new Error(
      "Access denied. You do not have permission to use the Kitchen Dashboard.",
    );
  }

  const text = await response.text();

  let result = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || `Server returned ${response.status}.`,
    );
  }

  return result;
}

/* =========================================================
   CREATE NATIVE KITCHEN STRUCTURE
   ========================================================= */

function adminKitchenCreateStructure() {
  const section = adminKitchen$("kitchenSection");

  if (!section) {
    return false;
  }

  /*
   * Do not recreate the structure every time
   * the Admin switches sections.
   */
  const existingRoot = adminKitchen$("adminKitchenRoot");

  if (existingRoot) {
    if (existingRoot.querySelector("#adminKitchenPendingOrders")) {
      return true;
    }
  }

  const root = existingRoot || document.createElement("div");

  root.id = "adminKitchenRoot";

  root.className = "admin-kitchen-root";

  root.innerHTML = `
    <div class="admin-kitchen-top-bar">

      <div class="admin-kitchen-title-area">
        <div>
          <h2>Kitchen Orders</h2>
          <p id="adminKitchenLastUpdated">-</p>
        </div>
      </div>

      <div class="admin-kitchen-search">
        <input
          type="text"
          id="adminKitchenSearch"
          placeholder="Search by Order ID or Table No."
          autocomplete="off"
        />
      </div>

      <button
        type="button"
        id="adminKitchenRefreshButton"
        class="admin-kitchen-refresh-button"
      >
        ↻ Refresh
      </button>

    </div>

    <p
      id="adminKitchenError"
      class="admin-kitchen-error"
    ></p>

    <!-- =====================================================
         NEW ORDERS
         ===================================================== -->

    <section class="admin-kitchen-section">

      <div class="admin-kitchen-section-header">

        <div class="admin-kitchen-section-title">

          <span class="admin-kitchen-section-icon">
            🆕
          </span>

          <div>
            <h2>New Orders</h2>
            <p>Orders waiting to be prepared</p>
          </div>

        </div>

        <span
          id="adminKitchenPendingCount"
          class="admin-kitchen-count"
        >
          0
        </span>

      </div>

      <div
        id="adminKitchenPendingOrders"
        class="admin-kitchen-orders-grid"
      >
        <p class="admin-kitchen-empty">
          No new orders
        </p>
      </div>

    </section>

    <!-- =====================================================
         PREPARING
         ===================================================== -->

    <section class="admin-kitchen-section">

      <div class="admin-kitchen-section-header">

        <div class="admin-kitchen-section-title">

          <span class="admin-kitchen-section-icon">
            👨‍🍳
          </span>

          <div>
            <h2>Preparing</h2>
            <p>Orders currently being prepared</p>
          </div>

        </div>

        <span
          id="adminKitchenPreparingCount"
          class="admin-kitchen-count"
        >
          0
        </span>

      </div>

      <div
        id="adminKitchenPreparingOrders"
        class="admin-kitchen-orders-grid"
      >
        <p class="admin-kitchen-empty">
          No orders being prepared
        </p>
      </div>

    </section>

    <!-- =====================================================
         READY
         ===================================================== -->

    <section class="admin-kitchen-section">

      <div class="admin-kitchen-section-header">

        <div class="admin-kitchen-section-title">

          <span class="admin-kitchen-section-icon">
            ✓
          </span>

          <div>
            <h2>Ready</h2>
            <p>Food ready to be served</p>
          </div>

        </div>

        <span
          id="adminKitchenReadyCount"
          class="admin-kitchen-count"
        >
          0
        </span>

      </div>

      <div
        id="adminKitchenReadyOrders"
        class="admin-kitchen-orders-grid"
      >
        <p class="admin-kitchen-empty">
          No ready orders
        </p>
      </div>

    </section>

    <!-- =====================================================
         PAID / CANCELLED
         ===================================================== -->

    <section class="admin-kitchen-section">

      <div class="admin-kitchen-section-header">

        <div class="admin-kitchen-section-title">

          <span
            class="admin-kitchen-section-icon admin-kitchen-cancelled-icon"
          >
            💳
          </span>

          <div>
            <h2>Paid / Cancelled Orders</h2>
            <p>Review before closing the kitchen order</p>
          </div>

        </div>

        <span
          id="adminKitchenCancelledCount"
          class="admin-kitchen-count admin-kitchen-cancelled-count"
        >
          0
        </span>

      </div>

      <div
        id="adminKitchenCancelledOrders"
        class="admin-kitchen-orders-grid"
      >
        <p class="admin-kitchen-empty">
          No paid orders requiring review
        </p>
      </div>

    </section>
  `;

  /*
   * Replace the old iframe/container if it still exists.
   */
  const oldContainer = section.querySelector(".embedded-container");

  if (oldContainer) {
    oldContainer.replaceWith(root);
  } else if (!existingRoot) {
    section.appendChild(root);
  }

  return true;
}

/* =========================================================
   DOM REFERENCES
   ========================================================= */

function adminKitchenGetElements() {
  return {
    root: adminKitchen$("adminKitchenRoot"),

    search: adminKitchen$("adminKitchenSearch"),

    refreshButton: adminKitchen$("adminKitchenRefreshButton"),

    error: adminKitchen$("adminKitchenError"),

    lastUpdated: adminKitchen$("adminKitchenLastUpdated"),

    pendingOrders: adminKitchen$("adminKitchenPendingOrders"),

    preparingOrders: adminKitchen$("adminKitchenPreparingOrders"),

    readyOrders: adminKitchen$("adminKitchenReadyOrders"),

    cancelledOrders: adminKitchen$("adminKitchenCancelledOrders"),

    pendingCount: adminKitchen$("adminKitchenPendingCount"),

    preparingCount: adminKitchen$("adminKitchenPreparingCount"),

    readyCount: adminKitchen$("adminKitchenReadyCount"),

    cancelledCount: adminKitchen$("adminKitchenCancelledCount"),
  };
}

/* =========================================================
   SEARCH
   ========================================================= */

function adminKitchenGetFilteredOrders() {
  const elements = adminKitchenGetElements();

  if (!elements.search) {
    return [...adminKitchenOrders];
  }

  const searchValue = elements.search.value.trim().toLowerCase();

  if (!searchValue) {
    return [...adminKitchenOrders];
  }

  return adminKitchenOrders.filter((order) => {
    const orderId = String(order?.orderId ?? "").toLowerCase();

    const tableNumber = String(order?.tableNumber ?? "").toLowerCase();

    return orderId.includes(searchValue) || tableNumber.includes(searchValue);
  });
}

/* =========================================================
   LOAD ORDERS
   ========================================================= */

async function loadAdminKitchenOrders() {
  if (adminKitchenLoading) {
    return;
  }

  const elements = adminKitchenGetElements();

  if (!elements.root) {
    return;
  }

  const token = localStorage.getItem(ADMIN_KITCHEN_TOKEN_KEY);

  if (!token) {
    return;
  }

  adminKitchenLoading = true;

  try {
    if (elements.error) {
      elements.error.textContent = "";
    }

    if (elements.lastUpdated) {
      elements.lastUpdated.textContent = "Loading orders...";
    }

    const result = await adminKitchenApi("/kitchen/orders", {
      method: "GET",
    });

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to load kitchen orders.");
    }

    const orders = Array.isArray(result?.data) ? result.data : [];

    adminKitchenOrders = orders;

    adminKitchenRenderOrders();

    if (elements.lastUpdated) {
      elements.lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  } catch (error) {
    console.error("Admin Kitchen API Error:", error);

    if (elements.error) {
      elements.error.textContent = adminKitchenGetErrorMessage(
        error,
        "Unable to load kitchen orders.",
      );
    }

    if (elements.lastUpdated) {
      elements.lastUpdated.textContent = "Unable to update";
    }

    /*
     * Keep already displayed orders on
     * temporary network failure.
     */
  } finally {
    adminKitchenLoading = false;
  }
}

/* =========================================================
   RENDER ALL ORDERS
   ========================================================= */

function adminKitchenRenderOrders() {
  const orders = adminKitchenGetFilteredOrders();

  const elements = adminKitchenGetElements();

  if (!elements.root) {
    return;
  }

  /*
   * Clear all sections.
   */
  elements.pendingOrders.innerHTML = "";

  elements.preparingOrders.innerHTML = "";

  elements.readyOrders.innerHTML = "";

  elements.cancelledOrders.innerHTML = "";

  let pendingTotal = 0;

  let preparingTotal = 0;

  let readyTotal = 0;

  let cancelledTotal = 0;

  /*
   * Put orders into their correct sections.
   */
  orders.forEach((order) => {
    const card = adminKitchenCreateOrderCard(order);

    const orderStatus = adminKitchenNormalizeStatus(order?.orderStatus);

    if (orderStatus === "PENDING" || orderStatus === "ORDER_PLACED") {
      elements.pendingOrders.appendChild(card);

      pendingTotal++;

      return;
    }

    if (orderStatus === "PREPARING") {
      elements.preparingOrders.appendChild(card);

      preparingTotal++;

      return;
    }

    if (orderStatus === "READY") {
      elements.readyOrders.appendChild(card);

      readyTotal++;

      return;
    }

    if (orderStatus === "PAID") {
      elements.cancelledOrders.appendChild(card);

      cancelledTotal++;
    }
  });

  /*
   * Counts.
   */
  elements.pendingCount.textContent = pendingTotal;

  elements.preparingCount.textContent = preparingTotal;

  elements.readyCount.textContent = readyTotal;

  elements.cancelledCount.textContent = cancelledTotal;

  /*
   * Empty states.
   */
  if (pendingTotal === 0) {
    elements.pendingOrders.innerHTML = `
      <p class="admin-kitchen-empty">
        No new orders
      </p>
    `;
  }

  if (preparingTotal === 0) {
    elements.preparingOrders.innerHTML = `
      <p class="admin-kitchen-empty">
        No orders being prepared
      </p>
    `;
  }

  if (readyTotal === 0) {
    elements.readyOrders.innerHTML = `
      <p class="admin-kitchen-empty">
        No ready orders
      </p>
    `;
  }

  if (cancelledTotal === 0) {
    elements.cancelledOrders.innerHTML = `
      <p class="admin-kitchen-empty">
        No paid orders requiring review
      </p>
    `;
  }
}

/* =========================================================
   CREATE ORDER CARD
   ========================================================= */

function adminKitchenCreateOrderCard(order) {
  const card = document.createElement("article");

  card.className = "admin-kitchen-order-card";

  const orderStatus = adminKitchenNormalizeStatus(order?.orderStatus);

  /*
   * HEADER
   */
  const header = document.createElement("div");

  header.className = "admin-kitchen-order-header";

  const heading = document.createElement("div");

  heading.className = "admin-kitchen-order-heading";

  const title = document.createElement("h3");

  title.textContent = `Order #${order?.orderId ?? ""}`;

  const table = document.createElement("p");

  table.textContent = `Table ${order?.tableNumber ?? ""}`;

  heading.appendChild(title);

  heading.appendChild(table);

  /*
   * Status badge.
   */
  const status = document.createElement("span");

  status.className = `admin-kitchen-order-status admin-kitchen-order-status-${orderStatus.toLowerCase()}`;

  status.textContent = adminKitchenFormatStatus(order?.orderStatus);

  header.appendChild(heading);

  header.appendChild(status);

  card.appendChild(header);

  /*
   * ORDER TIME
   */
  if (order?.orderTime) {
    const orderTime = document.createElement("p");

    orderTime.className = "admin-kitchen-order-time";

    orderTime.textContent = `Ordered: ${adminKitchenFormatDateTime(
      order.orderTime,
    )}`;

    card.appendChild(orderTime);
  }

  /*
   * CUSTOMER
   */
  if (order?.customerName !== undefined || order?.customerPhone !== undefined) {
    const customer = document.createElement("div");

    customer.className = "admin-kitchen-customer";

    const customerName = order?.customerName || order?.customer || "Guest";

    customer.innerHTML = `
      <span>Customer</span>
      <strong>
        ${adminKitchenEscapeHtml(customerName)}
      </strong>
    `;

    card.appendChild(customer);
  }

  /*
   * ITEMS
   */
  const itemsContainer = document.createElement("div");

  itemsContainer.className = "admin-kitchen-items";

  if (!Array.isArray(order?.items) || order.items.length === 0) {
    itemsContainer.innerHTML = `
      <p class="admin-kitchen-empty">
        No items found
      </p>
    `;
  } else {
    order.items.forEach((item) => {
      itemsContainer.appendChild(adminKitchenCreateOrderItem(item));
    });
  }

  card.appendChild(itemsContainer);

  /*
   * ORDER TOTAL
   */
  if (order?.subtotal !== undefined && order?.subtotal !== null) {
    const total = document.createElement("div");

    total.className = "admin-kitchen-order-total";

    total.innerHTML = `
      <span>Current Bill</span>
      <strong>
        ${adminKitchenMoney(order.subtotal)}
      </strong>
    `;

    card.appendChild(total);
  }

  /*
   * PAID ORDER REVIEW / CLOSE
   */
  if (orderStatus === "PAID") {
    const closeContainer = document.createElement("div");

    closeContainer.className = "admin-kitchen-close-order-container";

    const reviewText = document.createElement("p");

    reviewText.className = "admin-kitchen-review-message";

    reviewText.textContent =
      "Payment completed. Review the cancelled items before closing this kitchen order.";

    closeContainer.appendChild(reviewText);

    const closeButton = document.createElement("button");

    closeButton.type = "button";

    closeButton.className = "admin-kitchen-close-order-button";

    closeButton.textContent = "Close Order";

    closeButton.addEventListener("click", () => {
      adminKitchenCloseOrder(order.orderId, closeButton);
    });

    closeContainer.appendChild(closeButton);

    card.appendChild(closeContainer);
  }

  return card;
}

/* =========================================================
   CREATE ORDER ITEM
   ========================================================= */

function adminKitchenCreateOrderItem(item) {
  const itemCard = document.createElement("div");

  itemCard.className = "admin-kitchen-item";

  const itemStatus = adminKitchenNormalizeStatus(item?.status);

  if (itemStatus === "CANCELLED") {
    itemCard.classList.add("admin-kitchen-item-cancelled");
  }

  /*
   * ITEM INFORMATION
   */
  const information = document.createElement("div");

  information.className = "admin-kitchen-item-information";

  const name = document.createElement("h4");

  name.textContent = item?.itemName || item?.name || "Unknown Item";

  const quantity = document.createElement("p");

  quantity.textContent = `Quantity: ${item?.quantity ?? 0}`;

  const itemId = document.createElement("small");

  itemId.textContent = `Item #${item?.itemId ?? ""}`;

  information.appendChild(name);

  information.appendChild(quantity);

  information.appendChild(itemId);

  itemCard.appendChild(information);

  /*
   * STATUS
   */
  const statusColumn = document.createElement("div");

  statusColumn.className = "admin-kitchen-item-status-column";

  const statusLabel = document.createElement("span");

  statusLabel.className = "admin-kitchen-item-status-label";

  statusLabel.textContent = "Status";

  const status = document.createElement("span");

  status.className = `admin-kitchen-item-status admin-kitchen-status-${itemStatus.toLowerCase()}`;

  status.textContent = adminKitchenFormatStatus(item?.status);

  statusColumn.appendChild(statusLabel);

  statusColumn.appendChild(status);

  itemCard.appendChild(statusColumn);

  /*
   * ACTION BUTTONS
   */
  const buttons = document.createElement("div");

  buttons.className = "admin-kitchen-item-buttons";

  if (itemStatus === "ORDER_PLACED") {
    buttons.appendChild(
      adminKitchenCreateStatusButton(
        "Start Preparing",
        "PREPARING",
        item?.itemId,
      ),
    );
  } else if (itemStatus === "PREPARING") {
    buttons.appendChild(
      adminKitchenCreateStatusButton("Mark Ready", "READY", item?.itemId),
    );
  } else if (itemStatus === "READY") {
    buttons.appendChild(
      adminKitchenCreateStatusButton("Mark Served", "SERVED", item?.itemId),
    );
  } else if (itemStatus === "SERVED") {
    const served = document.createElement("span");

    served.className = "admin-kitchen-served-label";

    served.textContent = "✓ Served";

    buttons.appendChild(served);
  } else if (itemStatus === "CANCELLED") {
    const cancelled = document.createElement("span");

    cancelled.className = "admin-kitchen-cancelled-label";

    cancelled.textContent = "✕ Cancelled";

    buttons.appendChild(cancelled);
  }

  itemCard.appendChild(buttons);

  return itemCard;
}

/* =========================================================
   CREATE STATUS BUTTON
   ========================================================= */

function adminKitchenCreateStatusButton(text, newStatus, itemId) {
  const button = document.createElement("button");

  button.type = "button";

  button.className = "admin-kitchen-action-button";

  button.textContent = text;

  button.addEventListener("click", () => {
    adminKitchenUpdateItemStatus(itemId, newStatus, button);
  });

  return button;
}

/* =========================================================
   UPDATE ITEM STATUS
   ========================================================= */

async function adminKitchenUpdateItemStatus(itemId, newStatus, button) {
  if (!itemId) {
    adminKitchenToast(
      "Unable to update item",
      "The kitchen item ID is missing.",
      "error",
    );

    return;
  }

  try {
    button.disabled = true;

    button.dataset.originalText = button.textContent;

    button.textContent = "Updating...";

    const result = await adminKitchenApi(
      `/kitchen/order-items/${itemId}/status`,
      {
        method: "PUT",

        body: {
          status: newStatus,
        },
      },
    );

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to update item status.");
    }

    await loadAdminKitchenOrders();

    adminKitchenToast(
      "Kitchen updated",
      `Item is now ${adminKitchenFormatStatus(newStatus)}.`,
      "success",
    );
  } catch (error) {
    console.error("Admin Kitchen Item Status Error:", error);

    adminKitchenToast(
      "Unable to update item",
      adminKitchenGetErrorMessage(error, "Unable to update item status."),
      "error",
    );

    button.disabled = false;

    button.textContent =
      button.dataset.originalText || adminKitchenGetButtonText(newStatus);
  }
}

/* =========================================================
   CLOSE KITCHEN ORDER
   ========================================================= */

async function adminKitchenCloseOrder(orderId, button) {
  if (!orderId) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to close Order #${orderId}?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    button.disabled = true;

    button.dataset.originalText = button.textContent;

    button.textContent = "Closing...";

    const result = await adminKitchenApi(`/kitchen/orders/${orderId}/close`, {
      method: "PUT",
    });

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to close kitchen order.");
    }

    await loadAdminKitchenOrders();

    adminKitchenToast(
      "Order closed",
      `Order #${orderId} has been closed.`,
      "success",
    );
  } catch (error) {
    console.error("Admin Kitchen Close Order Error:", error);

    adminKitchenToast(
      "Unable to close order",
      adminKitchenGetErrorMessage(error, "Unable to close kitchen order."),
      "error",
    );

    button.disabled = false;

    button.textContent = button.dataset.originalText || "Close Order";
  }
}

/* =========================================================
   BUTTON TEXT
   ========================================================= */

function adminKitchenGetButtonText(status) {
  const normalized = adminKitchenNormalizeStatus(status);

  if (normalized === "PREPARING") {
    return "Start Preparing";
  }

  if (normalized === "READY") {
    return "Mark Ready";
  }

  if (normalized === "SERVED") {
    return "Mark Served";
  }

  return "Update";
}

/* =========================================================
   CLEAR ORDERS
   ========================================================= */

function adminKitchenClearOrders() {
  const elements = adminKitchenGetElements();

  if (!elements.root) {
    return;
  }

  elements.pendingOrders.innerHTML = `
    <p class="admin-kitchen-empty">
      No new orders
    </p>
  `;

  elements.preparingOrders.innerHTML = `
    <p class="admin-kitchen-empty">
      No orders being prepared
    </p>
  `;

  elements.readyOrders.innerHTML = `
    <p class="admin-kitchen-empty">
      No ready orders
    </p>
  `;

  elements.cancelledOrders.innerHTML = `
    <p class="admin-kitchen-empty">
      No paid orders requiring review
    </p>
  `;

  elements.pendingCount.textContent = "0";

  elements.preparingCount.textContent = "0";

  elements.readyCount.textContent = "0";

  elements.cancelledCount.textContent = "0";
}

/* =========================================================
   SEARCH LISTENER
   ========================================================= */

function adminKitchenHandleSearch(event) {
  adminKitchenRenderOrders();
}

/* =========================================================
   REFRESH
   ========================================================= */

async function adminKitchenRefresh() {
  await loadAdminKitchenOrders();
}

/* =========================================================
   AUTO REFRESH
   ========================================================= */

function adminKitchenStartAutoRefresh() {
  adminKitchenStopAutoRefresh();

  /*
   * Same 5-second polling behavior as
   * the standalone Kitchen dashboard.
   */
  adminKitchenRefreshTimer = setInterval(() => {
    /*
     * Only refresh while the Kitchen
     * section is currently visible.
     */
    const section = adminKitchen$("kitchenSection");

    if (section && !section.classList.contains("hidden")) {
      loadAdminKitchenOrders();
    }
  }, 5000);
}

/* =========================================================
   STOP AUTO REFRESH
   ========================================================= */

function adminKitchenStopAutoRefresh() {
  if (adminKitchenRefreshTimer) {
    clearInterval(adminKitchenRefreshTimer);

    adminKitchenRefreshTimer = null;
  }
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function adminKitchenInitializeEvents() {
  const elements = adminKitchenGetElements();

  if (elements.search) {
    elements.search.addEventListener("input", adminKitchenHandleSearch);
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener("click", adminKitchenRefresh);
  }
}

/* =========================================================
   INITIALIZE
   ========================================================= */

async function initAdminKitchen() {
  /*
   * Admin Dashboard calls this every time
   * the Kitchen section is opened.
   */
  if (!adminKitchenCreateStructure()) {
    console.error("Admin Kitchen: kitchenSection was not found.");

    return;
  }

  /*
   * Events only once.
   */
  if (!adminKitchenInitialized) {
    adminKitchenInitializeEvents();

    adminKitchenInitialized = true;

    adminKitchenStartAutoRefresh();
  }

  /*
   * Always load fresh Kitchen data when
   * entering the section.
   */
  await loadAdminKitchenOrders();
}

/* =========================================================
   PUBLIC ADMIN API
   ========================================================= */

window.initAdminKitchen = initAdminKitchen;

/* =========================================================
   OPTIONAL CLEANUP
   ========================================================= */

window.stopAdminKitchen = adminKitchenStopAutoRefresh;
