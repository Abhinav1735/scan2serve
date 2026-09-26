"use strict";

/* =========================================================
   SCAN2SERVE - KITCHEN DASHBOARD
   Authentication + Kitchen Dashboard
   ========================================================= */

/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = "https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run";

/* =========================================================
   KITCHEN SESSION
   =========================================================

   The Kitchen Dashboard keeps its own persistent JWT session.

   - Login -> token and employee are saved in localStorage
   - Hard refresh -> session is restored
   - Browser reopen -> session remains
   - Explicit Logout -> session is removed
   - Invalid/expired JWT -> session is removed automatically

   ========================================================= */

const KITCHEN_TOKEN_KEY = "scan2serve_kitchen_token";

const KITCHEN_EMPLOYEE_KEY = "scan2serve_kitchen_employee";

let kitchenToken = null;

let kitchenEmployee = null;

let activeKitchenOrders = [];

let refreshTimer = null;

/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

/* =========================================================
   DOM REFERENCES
   ========================================================= */

const loginScreen = $("loginScreen");

const dashboardScreen = $("dashboardScreen");

const loginForm = $("loginForm");

const loginUsername = $("loginUsername");

const loginPassword = $("loginPassword");

const passwordToggle = $("passwordToggle");

const loginButton = $("loginButton");

const loginError = $("loginError");

const logoutButton = $("logoutButton");

const employeeName = $("employeeName");

const employeeRole = $("employeeRole");

const refreshButton = $("refreshButton");

const kitchenSearch = $("kitchenSearch");

const kitchenError = $("kitchenError");

const kitchenStatus = $("lastUpdated");

const pendingOrders = $("pendingOrders");

const preparingOrders = $("preparingOrders");

const readyOrders = $("readyOrders");

const cancelledOrders = $("cancelledOrders");

const pendingCount = $("pendingCount");

const preparingCount = $("preparingCount");

const readyCount = $("readyCount");

const cancelledCount = $("cancelledCount");

/* =========================================================
   INITIAL PAGE STATE
   ========================================================= */

function showLoginScreen() {
  loginScreen.classList.remove("hidden");

  dashboardScreen.classList.add("hidden");

  document.body.classList.add("login-active");
}

function showDashboardScreen() {
  loginScreen.classList.add("hidden");

  dashboardScreen.classList.remove("hidden");

  document.body.classList.remove("login-active");
}

/* =========================================================
   LOGIN ERROR
   ========================================================= */

function showLoginError(message) {
  loginError.textContent = message;

  loginError.classList.remove("hidden");
}

function clearLoginError() {
  loginError.textContent = "";

  loginError.classList.add("hidden");
}

/* =========================================================
   NORMALIZE ROLE
   ========================================================= */

function normalizeRole(role) {
  if (!role) {
    return "";
  }

  return String(role).trim().toUpperCase().replace("ROLE_", "");
}

/* =========================================================
   ROLE ACCESS
   ========================================================= */

function canAccessKitchen(role) {
  const normalizedRole = normalizeRole(role);

  return normalizedRole === "KITCHEN" || normalizedRole === "ADMIN";
}

/* =========================================================
   LOGIN
   ========================================================= */

async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  const text = await response.text();

  let result = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch (error) {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "Invalid username or password.",
    );
  }

  if (result && result.success === false) {
    throw new Error(result.message || "Invalid username or password.");
  }

  /*
   * Backend response:
   *
   * {
   *   success: true,
   *   message: "Login Successful",
   *   data: {
   *     token: "...",
   *     tokenType: "Bearer",
   *     employee: {
   *       ...
   *       role: "KITCHEN"
   *     }
   *   }
   * }
   */

  const data = result?.data ?? result;

  const token = data?.token ?? result?.token;

  const employee = data?.employee ?? result?.employee;

  if (!token) {
    throw new Error(
      "Login succeeded but no authentication token was returned.",
    );
  }

  if (!employee) {
    throw new Error(
      "Login succeeded but employee information was not returned.",
    );
  }

  const role = normalizeRole(employee.role);

  /*
   * Authentication alone is not enough.
   *
   * The employee must have either:
   *
   * ADMIN
   *
   * or
   *
   * KITCHEN
   */

  if (!canAccessKitchen(role)) {
    throw new Error(
      "Access denied. Only Kitchen and Admin employees can access the Kitchen Dashboard.",
    );
  }

  kitchenToken = token;

  kitchenEmployee = employee;

  /*
   * IMPORTANT:
   *
   * Persist the Kitchen session.
   *
   * This is what prevents a hard refresh from
   * sending the user back to the login page.
   */

  localStorage.setItem(KITCHEN_TOKEN_KEY, kitchenToken);

  localStorage.setItem(KITCHEN_EMPLOYEE_KEY, JSON.stringify(kitchenEmployee));

  return employee;
}

/* =========================================================
   HANDLE LOGIN FORM
   ========================================================= */

async function handleLoginSubmit(event) {
  event.preventDefault();

  clearLoginError();

  const username = loginUsername.value.trim();

  const password = loginPassword.value;

  if (!username) {
    showLoginError("Please enter your username.");

    loginUsername.focus();

    return;
  }

  if (!password) {
    showLoginError("Please enter your password.");

    loginPassword.focus();

    return;
  }

  loginButton.disabled = true;

  loginButton.textContent = "Signing in...";

  try {
    const employee = await login(username, password);

    setEmployeeInformation(employee);

    showDashboardScreen();

    await loadKitchenOrders();

    startAutoRefresh();
  } catch (error) {
    console.error("Kitchen Login Error:", error);

    showLoginError(error.message || "Unable to login.");

    loginPassword.select();
  } finally {
    loginButton.disabled = false;

    loginButton.textContent = "Login to Kitchen";
  }
}

/* =========================================================
   EMPLOYEE INFORMATION
   ========================================================= */

function setEmployeeInformation(employee) {
  if (!employee) {
    return;
  }

  const name = employee.name || employee.username || "Kitchen Staff";

  const role = normalizeRole(employee.role);

  employeeName.textContent = name;

  employeeRole.textContent =
    role === "ADMIN" ? "Administrator" : "Kitchen Staff";
}

/* =========================================================
   CLOCK
   ========================================================= */

const currentDate = document.getElementById("currentDate");

setInterval(updateDateTime, 1000);

function updateDateTime() {
  if (!currentDate) {
    return;
  }

  const now = new Date();

  currentDate.textContent = now.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

updateDateTime();

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  stopAutoRefresh();

  kitchenToken = null;

  kitchenEmployee = null;

  activeKitchenOrders = [];

  /*
   * IMPORTANT:
   *
   * Explicit logout removes the persisted
   * Kitchen session.
   */

  localStorage.removeItem(KITCHEN_TOKEN_KEY);

  localStorage.removeItem(KITCHEN_EMPLOYEE_KEY);

  clearKitchenOrders();

  loginForm.reset();

  clearLoginError();

  showLoginScreen();

  loginUsername.focus();
}

/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function togglePasswordVisibility() {
  if (loginPassword.type === "password") {
    loginPassword.type = "text";

    passwordToggle.textContent = "Hide";

    passwordToggle.setAttribute("aria-label", "Hide password");
  } else {
    loginPassword.type = "password";

    passwordToggle.textContent = "Show";

    passwordToggle.setAttribute("aria-label", "Show password");
  }
}

/* =========================================================
   AUTHENTICATED API REQUEST
   ========================================================= */

async function kitchenApi(endpoint, options = {}) {
  if (!kitchenToken) {
    throw new Error("Your Kitchen session has expired. Please login again.");
  }

  const headers = {
    ...(options.headers || {}),

    Authorization: `Bearer ${kitchenToken}`,

    Accept: "application/json",
  };

  /*
   * Only add Content-Type when
   * a body exists.
   */

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  /*
   * Authentication failure.
   *
   * JWT may have expired or become invalid.
   */

  if (response.status === 401) {
    logout();

    throw new Error("Your session has expired. Please login again.");
  }

  /*
   * Authorization failure.
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
  } catch (error) {
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
   LOAD KITCHEN ORDERS
   ========================================================= */

async function loadKitchenOrders() {
  if (!kitchenToken) {
    return;
  }

  try {
    kitchenError.textContent = "";

    kitchenStatus.textContent = "Loading orders...";

    const result = await kitchenApi("/kitchen/orders", {
      method: "GET",
    });

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to load kitchen orders.");
    }

    const orders = Array.isArray(result?.data) ? result.data : [];

    activeKitchenOrders = orders;

    renderCurrentOrders();

    kitchenStatus.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error("Kitchen API Error:", error);

    kitchenError.textContent =
      error.message || "Unable to load kitchen orders.";

    kitchenStatus.textContent = "Unable to update";

    /*
     * Do not destroy already displayed
     * orders because of a temporary
     * network failure.
     */
  }
}

/* =========================================================
   SEARCH
   ========================================================= */

function searchKitchenOrders() {
  renderCurrentOrders();
}

/* =========================================================
   GET FILTERED ORDERS
   ========================================================= */

function getFilteredOrders() {
  const searchValue = kitchenSearch.value.trim().toLowerCase();

  if (!searchValue) {
    return [...activeKitchenOrders];
  }

  return activeKitchenOrders.filter((order) => {
    const orderId = String(order?.orderId ?? "").toLowerCase();

    const tableNumber = String(order?.tableNumber ?? "").toLowerCase();

    return orderId.includes(searchValue) || tableNumber.includes(searchValue);
  });
}

/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderCurrentOrders() {
  const orders = getFilteredOrders();

  displayKitchenOrders(orders);
}

/* =========================================================
   DISPLAY KITCHEN ORDERS
   ========================================================= */

function displayKitchenOrders(orders) {
  pendingOrders.innerHTML = "";

  preparingOrders.innerHTML = "";

  readyOrders.innerHTML = "";

  cancelledOrders.innerHTML = "";

  let pendingTotal = 0;

  let preparingTotal = 0;

  let readyTotal = 0;

  let cancelledTotal = 0;

  orders.forEach((order) => {
    const card = createOrderCard(order);

    /*
     * Current backend uses:
     *
     * PENDING
     * PREPARING
     * READY
     *
     * Paid/cancelled support
     * is prepared here as well.
     */

    if (order.orderStatus === "PENDING") {
      pendingOrders.appendChild(card);

      pendingTotal++;
    } else if (order.orderStatus === "PREPARING") {
      preparingOrders.appendChild(card);

      preparingTotal++;
    } else if (order.orderStatus === "READY") {
      readyOrders.appendChild(card);

      readyTotal++;
    } else if (order.orderStatus === "PAID") {
      cancelledOrders.appendChild(card);

      cancelledTotal++;
    }
  });

  pendingCount.textContent = pendingTotal;

  preparingCount.textContent = preparingTotal;

  readyCount.textContent = readyTotal;

  cancelledCount.textContent = cancelledTotal;

  /*
   * Empty states.
   */

  if (pendingTotal === 0) {
    pendingOrders.innerHTML = `<p class="kitchen-empty">
        No new orders
      </p>`;
  }

  if (preparingTotal === 0) {
    preparingOrders.innerHTML = `<p class="kitchen-empty">
        No orders being prepared
      </p>`;
  }

  if (readyTotal === 0) {
    readyOrders.innerHTML = `<p class="kitchen-empty">
        No ready orders
      </p>`;
  }

  if (cancelledTotal === 0) {
    cancelledOrders.innerHTML = `<p class="kitchen-empty">
        No paid orders requiring review
      </p>`;
  }
}

/* =========================================================
   CREATE ORDER CARD
   ========================================================= */

function createOrderCard(order) {
  const card = document.createElement("article");

  card.className = "kitchen-order-card";

  const orderStatus = normalizeOrderStatus(order.orderStatus);

  /*
   * HEADER
   */

  const header = document.createElement("div");

  header.className = "kitchen-order-header";

  const headerInformation = document.createElement("div");

  headerInformation.className = "kitchen-order-heading";

  const title = document.createElement("h3");

  title.textContent = `Order #${order.orderId ?? ""}`;

  const table = document.createElement("p");

  table.textContent = `Table ${order.tableNumber ?? ""}`;

  headerInformation.appendChild(title);

  headerInformation.appendChild(table);

  const status = document.createElement("span");

  status.className = `kitchen-order-status kitchen-order-status-${orderStatus.toLowerCase()}`;

  status.textContent = formatStatus(order.orderStatus);

  header.appendChild(headerInformation);

  header.appendChild(status);

  card.appendChild(header);

  /*
   * ORDER TIME
   */

  if (order.orderTime) {
    const orderTime = document.createElement("p");

    orderTime.className = "kitchen-order-time";

    orderTime.textContent = `Ordered: ${formatDateTime(order.orderTime)}`;

    card.appendChild(orderTime);
  }

  /*
   * ITEMS
   */

  const itemsContainer = document.createElement("div");

  itemsContainer.className = "kitchen-items";

  if (!Array.isArray(order.items) || order.items.length === 0) {
    itemsContainer.innerHTML = `<p class="kitchen-empty">
        No items found
      </p>`;
  } else {
    order.items.forEach((item) => {
      itemsContainer.appendChild(createOrderItem(item));
    });
  }

  card.appendChild(itemsContainer);

  /*
   * PAID ORDER REVIEW / CLOSE
   */

  if (order.orderStatus === "PAID") {
    const closeContainer = document.createElement("div");

    closeContainer.className = "kitchen-close-order-container";

    const reviewText = document.createElement("p");

    reviewText.className = "kitchen-review-message";

    reviewText.textContent =
      "Payment completed. Review the cancelled items before closing this kitchen order.";

    closeContainer.appendChild(reviewText);

    const closeButton = document.createElement("button");

    closeButton.type = "button";

    closeButton.className = "kitchen-close-order-button";

    closeButton.textContent = "Close Order";

    closeButton.addEventListener("click", () => {
      closeKitchenOrder(order.orderId, closeButton);
    });

    closeContainer.appendChild(closeButton);

    card.appendChild(closeContainer);
  }

  return card;
}

/* =========================================================
   CREATE ORDER ITEM
   ========================================================= */

function createOrderItem(item) {
  const itemCard = document.createElement("div");

  itemCard.className = "kitchen-item";

  if (item.status === "CANCELLED") {
    itemCard.classList.add("kitchen-item-cancelled");
  }

  /*
   * INFORMATION
   */

  const information = document.createElement("div");

  information.className = "kitchen-item-information";

  const name = document.createElement("h4");

  name.textContent = item.itemName || "Unknown Item";

  const quantity = document.createElement("p");

  quantity.textContent = `Quantity: ${item.quantity ?? 0}`;

  const itemId = document.createElement("small");

  itemId.textContent = `Item #${item.itemId ?? ""}`;

  information.appendChild(name);

  information.appendChild(quantity);

  information.appendChild(itemId);

  itemCard.appendChild(information);

  /*
   * STATUS
   */

  const statusColumn = document.createElement("div");

  statusColumn.className = "kitchen-item-status-column";

  const statusLabel = document.createElement("span");

  statusLabel.className = "kitchen-item-status-label";

  statusLabel.textContent = "Status";

  const status = document.createElement("span");

  const normalizedStatus = normalizeOrderStatus(item.status);

  status.className = `kitchen-item-status kitchen-status-${normalizedStatus.toLowerCase()}`;

  status.textContent = formatStatus(item.status);

  statusColumn.appendChild(statusLabel);

  statusColumn.appendChild(status);

  itemCard.appendChild(statusColumn);

  /*
   * BUTTONS
   */

  const buttons = document.createElement("div");

  buttons.className = "kitchen-item-buttons";

  if (item.status === "ORDER_PLACED") {
    buttons.appendChild(
      createStatusButton("Start Preparing", "PREPARING", item.itemId),
    );
  } else if (item.status === "PREPARING") {
    buttons.appendChild(createStatusButton("Mark Ready", "READY", item.itemId));
  } else if (item.status === "READY") {
    buttons.appendChild(
      createStatusButton("Mark Served", "SERVED", item.itemId),
    );
  } else if (item.status === "SERVED") {
    const served = document.createElement("span");

    served.className = "kitchen-served-label";

    served.textContent = "✓ Served";

    buttons.appendChild(served);
  } else if (item.status === "CANCELLED") {
    const cancelled = document.createElement("span");

    cancelled.className = "kitchen-cancelled-label";

    cancelled.textContent = "✕ Cancelled";

    buttons.appendChild(cancelled);
  }

  itemCard.appendChild(buttons);

  return itemCard;
}

/* =========================================================
   CREATE STATUS BUTTON
   ========================================================= */

function createStatusButton(text, newStatus, itemId) {
  const button = document.createElement("button");

  button.type = "button";

  button.className = "kitchen-action-button";

  button.textContent = text;

  button.addEventListener("click", () => {
    updateItemStatus(itemId, newStatus, button);
  });

  return button;
}

/* =========================================================
   UPDATE ITEM STATUS
   ========================================================= */

async function updateItemStatus(itemId, newStatus, button) {
  try {
    button.disabled = true;

    button.textContent = "Updating...";

    const result = await kitchenApi(`/kitchen/order-items/${itemId}/status`, {
      method: "PUT",

      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to update item status.");
    }

    await loadKitchenOrders();
  } catch (error) {
    console.error("Item Status Error:", error);

    alert(error.message || "Unable to update item status.");

    button.disabled = false;

    button.textContent = getButtonText(newStatus);
  }
}

/* =========================================================
   CLOSE KITCHEN ORDER
   ========================================================= */

async function closeKitchenOrder(orderId, button) {
  const confirmed = window.confirm(
    `Are you sure you want to close Order #${orderId}?`,
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  button.textContent = "Closing...";

  try {
    /*
     * Dedicated Kitchen endpoint.
     */

    const result = await kitchenApi(`/kitchen/orders/${orderId}/close`, {
      method: "PUT",
    });

    if (result && result.success === false) {
      throw new Error(result.message || "Unable to close kitchen order.");
    }

    await loadKitchenOrders();
  } catch (error) {
    console.error("Close Kitchen Order Error:", error);

    alert(error.message || "Unable to close kitchen order.");

    button.disabled = false;

    button.textContent = "Close Order";
  }
}

/* =========================================================
   BUTTON TEXT
   ========================================================= */

function getButtonText(status) {
  if (status === "PREPARING") {
    return "Start Preparing";
  }

  if (status === "READY") {
    return "Mark Ready";
  }

  if (status === "SERVED") {
    return "Mark Served";
  }

  return "Update";
}

/* =========================================================
   NORMALIZE ORDER STATUS
   ========================================================= */

function normalizeOrderStatus(status) {
  if (!status) {
    return "UNKNOWN";
  }

  return String(status).trim().toUpperCase();
}

/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(status) {
  const normalized = normalizeOrderStatus(status);

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
   FORMAT DATE/TIME
   ========================================================= */

function formatDateTime(dateTime) {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return String(dateTime);
  }

  return date.toLocaleString();
}

/* =========================================================
   CLEAR ORDERS
   ========================================================= */

function clearKitchenOrders() {
  pendingOrders.innerHTML = `<p class="kitchen-empty">
      No new orders
    </p>`;

  preparingOrders.innerHTML = `<p class="kitchen-empty">
      No orders being prepared
    </p>`;

  readyOrders.innerHTML = `<p class="kitchen-empty">
      No ready orders
    </p>`;

  cancelledOrders.innerHTML = `<p class="kitchen-empty">
      No paid orders requiring review
    </p>`;

  pendingCount.textContent = "0";

  preparingCount.textContent = "0";

  readyCount.textContent = "0";

  cancelledCount.textContent = "0";
}

/* =========================================================
   AUTO REFRESH
   ========================================================= */

function startAutoRefresh() {
  stopAutoRefresh();

  refreshTimer = setInterval(() => {
    if (kitchenToken) {
      loadKitchenOrders();
    }
  }, 5000);
}

/* =========================================================
   STOP AUTO REFRESH
   ========================================================= */

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);

    refreshTimer = null;
  }
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

loginForm.addEventListener("submit", handleLoginSubmit);

passwordToggle.addEventListener("click", togglePasswordVisibility);

logoutButton.addEventListener("click", logout);

refreshButton.addEventListener("click", loadKitchenOrders);

kitchenSearch.addEventListener("input", searchKitchenOrders);

/* =========================================================
   ENTER KEY
   ========================================================= */

loginUsername.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loginPassword.focus();
  }
});

/* =========================================================
   RESTORE KITCHEN SESSION
   ========================================================= */

function restoreKitchenSession() {
  const storedToken = localStorage.getItem(KITCHEN_TOKEN_KEY);

  const storedEmployee = localStorage.getItem(KITCHEN_EMPLOYEE_KEY);

  /*
   * No saved session.
   */

  if (!storedToken) {
    showLoginScreen();

    loginUsername.focus();

    return false;
  }

  /*
   * Restore JWT immediately.
   */

  kitchenToken = storedToken;

  /*
   * Restore employee information.
   */

  if (storedEmployee) {
    try {
      kitchenEmployee = JSON.parse(storedEmployee);
    } catch (error) {
      console.warn("Unable to restore Kitchen employee information.", error);

      kitchenEmployee = null;

      localStorage.removeItem(KITCHEN_EMPLOYEE_KEY);
    }
  }

  /*
   * Restore employee name and role
   * in the dashboard header.
   */

  if (kitchenEmployee) {
    setEmployeeInformation(kitchenEmployee);
  }

  /*
   * Show dashboard while the saved
   * token is validated by the first
   * protected API request.
   */

  showDashboardScreen();

  return true;
}

/* =========================================================
   INITIAL PAGE LOAD
   ========================================================= */

async function initializeKitchenDashboard() {
  const sessionRestored = restoreKitchenSession();

  if (!sessionRestored) {
    return;
  }

  /*
   * Validate the restored JWT by
   * loading the protected Kitchen API.
   *
   * If it returns 401, kitchenApi()
   * automatically logs the user out.
   */

  await loadKitchenOrders();

  /*
   * Start polling only when the
   * restored session is still valid.
   */

  if (kitchenToken) {
    startAutoRefresh();
  }
}

initializeKitchenDashboard();
