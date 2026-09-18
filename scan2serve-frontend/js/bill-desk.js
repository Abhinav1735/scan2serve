/* =========================================================
   SCAN2SERVE
   BILL DESK
   ========================================================= */

/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE_URL = "https://scan2servee.onrender.com";

const TOKEN_KEY = "scan2serve_token";

const EMPLOYEE_KEY = "scan2serve_employee";

const TAB_KEY = "scan2serve_bill_desk_selected_tab";

const RECENT_LIMIT = 10;

const AUTO_REFRESH = 60 * 1000;

const BILLABLE_STATUSES = ["READY", "SERVED"];

/* =========================================================
   DOM - LOGIN
   ========================================================= */

const loginScreen = document.getElementById("loginScreen");

const dashboardScreen = document.getElementById("dashboardScreen");

const loginForm = document.getElementById("loginForm");

const loginUsername = document.getElementById("loginUsername");

const loginPassword = document.getElementById("loginPassword");

const passwordToggle = document.getElementById("passwordToggle");

const loginButton = document.getElementById("loginButton");

const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");

const employeeName = document.getElementById("employeeName");

const employeeRole = document.getElementById("employeeRole");

/* =========================================================
   DOM - HEADER
   ========================================================= */

const currentDate = document.getElementById("currentDate");

/* =========================================================
   DOM - TABS
   ========================================================= */

const activeBillsTab = document.getElementById("activeBillsTab");

const oldBillsTab = document.getElementById("oldBillsTab");

const activeBillsSection = document.getElementById("activeBillsSection");

const oldBillsSection = document.getElementById("oldBillsSection");

/* =========================================================
   DOM - ACTIVE
   ========================================================= */

const activeBillsContainer = document.getElementById("activeBillsContainer");

const noActiveBills = document.getElementById("noActiveBills");

const activeBillCount = document.getElementById("activeBillCount");

const refreshActiveButton = document.getElementById("refreshActiveButton");

/* =========================================================
   DOM - OLD BILLS
   ========================================================= */

const orderIdInput = document.getElementById("orderIdInput");

const tableNumberInput = document.getElementById("tableNumberInput");

const dateInput = document.getElementById("dateInput");

const searchButton = document.getElementById("searchButton");

const clearButton = document.getElementById("clearButton");

const refreshRecentButton = document.getElementById("refreshRecentButton");

const searchMessage = document.getElementById("searchMessage");

const recentBillsContainer = document.getElementById("recentBillsContainer");

const recentBillsTitle = document.getElementById("recentBillsTitle");

const allBillsButton = document.getElementById("allBillsButton");

/* =========================================================
   DOM - MODAL
   ========================================================= */

const billModal = document.getElementById("billModal");

const modalOverlay = document.getElementById("modalOverlay");

const closeModalButton = document.getElementById("closeModalButton");

const modalCloseBottomButton = document.getElementById(
  "modalCloseBottomButton",
);

const modalLoading = document.getElementById("modalLoading");

const modalContent = document.getElementById("modalContent");

const modalError = document.getElementById("modalError");

const modalOrderInfo = document.getElementById("modalOrderInfo");

const modalOrderId = document.getElementById("modalOrderId");

const modalTableNumber = document.getElementById("modalTableNumber");

const modalCustomerName = document.getElementById("modalCustomerName");

const modalCustomerPhone = document.getElementById("modalCustomerPhone");

const modalOrderTime = document.getElementById("modalOrderTime");

const modalPaymentTime = document.getElementById("modalPaymentTime");

const modalBillStatus = document.getElementById("modalBillStatus");

const modalPaymentMethod = document.getElementById("modalPaymentMethod");

const modalBillItems = document.getElementById("modalBillItems");

const modalSubtotal = document.getElementById("modalSubtotal");

const modalGst = document.getElementById("modalGst");

const modalGstLabel = document.getElementById("modalGstLabel");

const modalGrandTotal = document.getElementById("modalGrandTotal");

/* =========================================================
   DOM - PAYMENT
   ========================================================= */

const paymentSection = document.getElementById("paymentSection");

const paymentMethod = document.getElementById("paymentMethod");

const payButton = document.getElementById("payButton");

const paidMessage = document.getElementById("paidMessage");

const paidMessageTime = document.getElementById("paidMessageTime");

/* =========================================================
   DOM - ACTIONS
   ========================================================= */

const cancelCompleteBillButton = document.getElementById(
  "cancelCompleteBillButton",
);

const refreshBillButton = document.getElementById("refreshBillButton");

const printButton = document.getElementById("printButton");

/* =========================================================
   STATE
   ========================================================= */

let currentOrderId = null;

let currentBill = null;

let currentBillIsOldBill = false;

let showAllOldBills = false;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();

  updateDateTime();

  restoreSession();
});

/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {
  loginForm.addEventListener("submit", handleLogin);

  passwordToggle.addEventListener("click", togglePassword);

  logoutButton.addEventListener("click", logout);

  activeBillsTab.addEventListener("click", () => {
    saveSelectedTab("active");

    showActiveBillsTab();

    loadActiveBills();
  });

  oldBillsTab.addEventListener("click", () => {
    saveSelectedTab("old");

    showOldBillsTab();

    if (hasActiveSearch()) {
      searchOldBills();
    } else {
      loadRecentBills();
    }
  });

  refreshActiveButton.addEventListener("click", async () => {
    setButtonLoading(refreshActiveButton, "↻ Refreshing...");

    try {
      await loadActiveBills();
    } finally {
      restoreButton(refreshActiveButton, "↻ Refresh");
    }
  });

  searchButton.addEventListener("click", searchOldBills);

  clearButton.addEventListener("click", clearSearch);

  refreshRecentButton.addEventListener("click", async () => {
    setButtonLoading(refreshRecentButton, "↻ Refreshing...");

    try {
      if (hasActiveSearch()) {
        await searchOldBills();
      } else {
        await loadRecentBills(showAllOldBills);
      }
    } finally {
      restoreButton(refreshRecentButton, "↻ Refresh");
    }
  });

  allBillsButton.addEventListener("click", async () => {
    showAllOldBills = !showAllOldBills;

    await loadRecentBills(showAllOldBills);
  });

  orderIdInput.addEventListener("keydown", handleSearchEnter);

  tableNumberInput.addEventListener("keydown", handleSearchEnter);

  dateInput.addEventListener("keydown", handleSearchEnter);

  closeModalButton.addEventListener("click", closeModal);

  modalCloseBottomButton.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", closeModal);

  refreshBillButton.addEventListener("click", async () => {
    if (currentOrderId === null) {
      return;
    }

    setButtonLoading(refreshBillButton, "↻ Refreshing...");

    try {
      await openBill(currentOrderId, currentBillIsOldBill);
    } finally {
      restoreButton(refreshBillButton, "↻ Refresh Bill");
    }
  });

  payButton.addEventListener("click", processPayment);

  printButton.addEventListener("click", () => {
    if (currentOrderId !== null) {
      printBill(currentOrderId);
    }
  });

  cancelCompleteBillButton.addEventListener("click", cancelCompleteBill);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !billModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

/* =========================================================
   CLOCK
   ========================================================= */

setInterval(updateDateTime, 1000);

function updateDateTime() {
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

/* =========================================================
   AUTO REFRESH
   ========================================================= */

setInterval(async () => {
  if (!hasToken()) {
    return;
  }

  try {
    await loadActiveBills();

    if (getSelectedTab() === "old") {
      if (hasActiveSearch()) {
        await searchOldBills();
      } else {
        await loadRecentBills(showAllOldBills);
      }
    }
  } catch (error) {
    console.error("Automatic refresh failed:", error);
  }
}, AUTO_REFRESH);

/* =========================================================
   AUTH
   ========================================================= */

async function handleLogin(event) {
  event.preventDefault();

  const username = loginUsername.value.trim();

  const password = loginPassword.value;

  if (!username || !password) {
    showLoginError("Username and password are required.");

    return;
  }

  loginError.classList.add("hidden");

  loginButton.disabled = true;

  loginButton.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Invalid username or password.");
    }

    const data = result?.data ?? result;
    const token = data?.token;

    const employee = data?.employee;

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

    const role = String(employee.role || "")
      .trim()
      .toUpperCase();

    if (role === "KITCHEN") {
      throw new Error(
        "This account cannot access Bill Desk. Please use the appropriate employee login.",
      );
    }

    localStorage.setItem(TOKEN_KEY, token);

    localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));

    showDashboard(employee);

    await loadActiveBills();

    if (getSelectedTab() === "old") {
      showOldBillsTab();

      if (hasActiveSearch()) {
        await searchOldBills();
      } else {
        await loadRecentBills();
      }
    }
  } catch (error) {
    console.error("Login error:", error);

    showLoginError(error.message || "Unable to login.");
  } finally {
    loginButton.disabled = false;

    loginButton.textContent = "Login to Bill Desk";
  }
}

/* =========================================================
   RESTORE SESSION
   ========================================================= */

function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    showLoginScreen();

    return;
  }

  let employee = {};

  try {
    employee = JSON.parse(localStorage.getItem(EMPLOYEE_KEY) || "{}");
  } catch {
    employee = {};
  }

  const role = String(employee.role || "")
    .trim()
    .toUpperCase();

  if (role === "KITCHEN") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPLOYEE_KEY);
    showLoginScreen();
    showLoginError(
      "This account cannot access Bill Desk. Please use the appropriate employee login.",
    );
    return;
  }

  showDashboard(employee);

  const selectedTab = getSelectedTab();

  if (selectedTab === "old") {
    showOldBillsTab();
  } else {
    showActiveBillsTab();
  }

  loadActiveBills();

  if (selectedTab === "old") {
    if (hasActiveSearch()) {
      searchOldBills();
    } else {
      loadRecentBills();
    }
  }
}

/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard(employee) {
  loginScreen.classList.add("hidden");

  dashboardScreen.classList.remove("hidden");

  if (employee) {
    employeeName.textContent =
      employee.name || employee.username || "Bill Desk Staff";

    employeeRole.textContent =
      String(employee.role || "BILL_DESK").toUpperCase() === "ADMIN"
        ? "Administration"
        : formatStatus(employee.role || "BILL_DESK");
  }
}

/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLoginScreen() {
  dashboardScreen.classList.add("hidden");

  loginScreen.classList.remove("hidden");
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(EMPLOYEE_KEY);

  currentOrderId = null;

  currentBill = null;

  closeModal();

  showLoginScreen();

  loginForm.reset();
}

/* =========================================================
   PASSWORD
   ========================================================= */

function togglePassword() {
  if (loginPassword.type === "password") {
    loginPassword.type = "text";

    passwordToggle.textContent = "Hide";
  } else {
    loginPassword.type = "password";

    passwordToggle.textContent = "Show";
  }
}

/* =========================================================
   LOGIN ERROR
   ========================================================= */

function showLoginError(message) {
  loginError.textContent = message;

  loginError.classList.remove("hidden");
}

/* =========================================================
   API
   ========================================================= */

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();

    throw new Error("Your session has expired. Please login again.");
  }

  return response;
}

/* =========================================================
   PARSE RESPONSE
   ========================================================= */

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: response.ok,

      message: text,
    };
  }
}

/* =========================================================
   ACTIVE TAB
   ========================================================= */

function showActiveBillsTab() {
  activeBillsTab.classList.add("active");

  oldBillsTab.classList.remove("active");

  activeBillsSection.classList.remove("hidden");

  oldBillsSection.classList.add("hidden");
}

/* =========================================================
   OLD TAB
   ========================================================= */

function showOldBillsTab() {
  oldBillsTab.classList.add("active");

  activeBillsTab.classList.remove("active");

  oldBillsSection.classList.remove("hidden");

  activeBillsSection.classList.add("hidden");
}

/* =========================================================
   TAB STORAGE
   ========================================================= */

function saveSelectedTab(tab) {
  localStorage.setItem(TAB_KEY, tab);
}

function getSelectedTab() {
  return localStorage.getItem(TAB_KEY) || "active";
}

/* =========================================================
   ACTIVE BILLS
   ========================================================= */

async function loadActiveBills() {
  if (!hasToken()) {
    return;
  }

  activeBillsContainer.innerHTML = `<div class="loading">
       Loading active bills...
     </div>`;

  noActiveBills.classList.add("hidden");

  try {
    const response = await apiFetch(`${API_BASE_URL}/bill-desk/orders`);

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to load active bills.");
    }

    const orders = Array.isArray(result?.data) ? result.data : [];

    const activeOrders = orders.filter((order) => {
      const status = getOrderStatus(order);

      return status !== "PAID" && status !== "CANCELLED";
    });

    activeBillCount.textContent = `${activeOrders.length} Active Bill${
      activeOrders.length === 1 ? "" : "s"
    }`;

    if (activeOrders.length === 0) {
      activeBillsContainer.innerHTML = "";

      noActiveBills.classList.remove("hidden");

      return;
    }

    displayActiveBills(activeOrders);
  } catch (error) {
    console.error("Active bills error:", error);

    activeBillsContainer.innerHTML = `<div class="loading">
         Unable to load active bills.<br>
         ${escapeHtml(error.message)}
       </div>`;
  }
}

/* =========================================================
   DISPLAY ACTIVE BILLS
   ========================================================= */

function displayActiveBills(orders) {
  activeBillsContainer.innerHTML = "";

  orders.forEach((order) => {
    const card = document.createElement("div");

    card.className = "bill-card";

    const customerName = order.customerName || "Walk-in Customer";

    const amount = getOrderAmount(order);

    card.innerHTML = `

        <div class="bill-card-top">

          <div class="bill-icon">
            🛎
          </div>

          <div>

            <h3>
              Order #${escapeHtml(order.id)}
            </h3>

            <div class="table-number">
              Table ${escapeHtml(order.tableNumber ?? "-")}
            </div>

          </div>

        </div>


        <div class="customer-preview">

          <span>
            Customer
          </span>

          <strong>
            ${escapeHtml(customerName)}
          </strong>

        </div>


        <div class="bill-amount">
          ₹${formatMoney(amount)}
        </div>


        <div class="bill-amount-label">
          Current bill amount
        </div>


        <button
          class="view-bill-button"
          type="button"
        >
          ◉ View Bill
        </button>

      `;

    const button = card.querySelector(".view-bill-button");

    button.addEventListener("click", () => {
      openBill(order.id, false);
    });

    activeBillsContainer.appendChild(card);
  });
}

/* =========================================================
   OPEN BILL
   ========================================================= */

async function openBill(orderId, isOldBill = false) {
  currentOrderId = orderId;

  currentBillIsOldBill = Boolean(isOldBill);

  billModal.classList.remove("hidden");

  modalLoading.classList.remove("hidden");

  modalContent.classList.add("hidden");

  modalError.classList.add("hidden");

  paidMessage.classList.add("hidden");

  modalOrderInfo.textContent = `Order #${orderId}`;

  try {
    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/orders/${orderId}/bill`,
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to load bill.");
    }

    currentBill = result?.data;

    if (!currentBill) {
      throw new Error("Bill data was not returned by the server.");
    }

    displayBill(currentBill, currentBillIsOldBill);
  } catch (error) {
    console.error("Open bill error:", error);

    modalLoading.classList.add("hidden");

    modalError.textContent = error.message || "Unable to load bill.";

    modalError.classList.remove("hidden");
  }
}

/* =========================================================
   DISPLAY BILL
   ========================================================= */

function displayBill(bill, isOldBill) {
  modalLoading.classList.add("hidden");

  modalContent.classList.remove("hidden");

  modalOrderId.textContent = bill.orderId ?? currentOrderId;

  modalTableNumber.textContent = bill.tableNumber ?? "-";

  modalCustomerName.textContent =
    bill.customerName && String(bill.customerName).trim()
      ? bill.customerName
      : "Walk-in Customer";

  modalCustomerPhone.textContent =
    bill.customerPhone && String(bill.customerPhone).trim()
      ? bill.customerPhone
      : "Not Provided";

  modalOrderTime.textContent = formatDateTime(bill.orderTime);

  modalPaymentTime.textContent = bill.paymentTime
    ? formatDateTime(bill.paymentTime)
    : "Not Paid Yet";

  const status = getBillStatus(bill);

  modalBillStatus.textContent = formatStatus(status);

  modalPaymentMethod.textContent = bill.paymentMethod
    ? formatStatus(bill.paymentMethod)
    : "-";

  modalOrderInfo.textContent = `Order #${bill.orderId ?? currentOrderId}`;

  modalGstLabel.textContent = `GST (${Number(bill.gstPercentage ?? 5)}%)`;

  modalSubtotal.textContent = `₹${formatMoney(bill.subtotal)}`;

  modalGst.textContent = `₹${formatMoney(bill.gst)}`;

  modalGrandTotal.textContent = `₹${formatMoney(bill.grandTotal)}`;

  renderBillItems(bill, isOldBill);

  updatePaymentUI(bill, isOldBill);

  updateCompleteCancelButton(bill, isOldBill);
}

/* =========================================================
   BILL ITEMS
   ========================================================= */

function renderBillItems(bill, isOldBill) {
  modalBillItems.innerHTML = "";

  const items = Array.isArray(bill.items) ? bill.items : [];

  if (items.length === 0) {
    modalBillItems.innerHTML = `<tr>
         <td
           colspan="6"
           class="item-action-disabled"
           style="text-align:center;padding:30px"
         >
           No items found.
         </td>
       </tr>`;

    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");

    const status = String(item.status || "ORDER_PLACED").toUpperCase();

    const isBillable = BILLABLE_STATUSES.includes(status);

    if (isBillable) {
      row.classList.add("billable-row");
    } else {
      row.classList.add("non-billable-row");
    }

    if (status === "CANCELLED") {
      row.classList.add("cancelled-row");
    }

    const total =
      item.totalPrice ?? Number(item.price || 0) * Number(item.quantity || 0);

    const canCancel =
      !isOldBill &&
      status !== "SERVED" &&
      status !== "CANCELLED" &&
      (status === "ORDER_PLACED" ||
        status === "PREPARING" ||
        status === "READY") &&
      item.itemId !== null &&
      item.itemId !== undefined;

    row.innerHTML = `

        <td>
          ${escapeHtml(item.itemName || "-")}
        </td>


        <td>
          ${escapeHtml(item.quantity ?? 0)}
        </td>


        <td>
          ₹${formatMoney(item.unitPrice ?? item.price ?? 0)}
        </td>


        <td>
          ₹${formatMoney(total)}
        </td>


        <td>

          <span
            class="status ${status.toLowerCase()}"
          >
            ${escapeHtml(formatStatus(status))}
          </span>

        </td>


        <td class="bill-item-action-cell">
          ${
            canCancel
              ? `
                <button
                  type="button"
                  class="bill-item-cancel-button"
                  data-item-id="${Number(item.itemId)}"
                >
                  ✕ Cancel
                </button>
              `
              : status === "CANCELLED"
                ? `
                <span class="item-action-disabled">
                  Cancelled
                </span>
              `
                : status === "SERVED"
                  ? `
                <span class="item-action-disabled">
                  Served
                </span>
              `
                  : `
                <span class="item-action-disabled">
                  Not Available
                </span>
              `
          }
        </td>

      `;

    if (canCancel) {
      const cancelButton = row.querySelector(".bill-item-cancel-button");

      cancelButton.addEventListener("click", () => {
        cancelBillItem(item.itemId);
      });
    }

    modalBillItems.appendChild(row);
  });
}

/* =========================================================
   PAYMENT UI
   ========================================================= */

function updatePaymentUI(bill, isOldBill) {
  const status = getBillStatus(bill);

  const isPaid =
    status === "PAID" || status === "COMPLETED" || Boolean(bill.paymentTime);

  const isCancelled = status === "CANCELLED";

  if (isPaid) {
    paymentSection.classList.add("hidden");

    paidMessage.classList.remove("hidden");

    paidMessageTime.textContent = bill.paymentTime
      ? `Payment completed on ${formatDateTime(bill.paymentTime)}.`
      : "Payment completed successfully.";

    return;
  }

  paidMessage.classList.add("hidden");

  if (isOldBill || isCancelled) {
    paymentSection.classList.add("hidden");
  } else {
    paymentSection.classList.remove("hidden");
  }
}

/* =========================================================
   COMPLETE BILL CANCEL BUTTON
   ========================================================= */

function updateCompleteCancelButton(bill, isOldBill) {
  const status = getBillStatus(bill);

  const isPaid =
    status === "PAID" || status === "COMPLETED" || Boolean(bill.paymentTime);

  if (status === "CANCELLED") {
    cancelCompleteBillButton.disabled = true;

    cancelCompleteBillButton.textContent = "Bill Cancelled";

    return;
  }

  if (isPaid || isOldBill) {
    cancelCompleteBillButton.disabled = true;

    cancelCompleteBillButton.textContent = "Bill Already Paid";

    return;
  }

  cancelCompleteBillButton.disabled = false;

  cancelCompleteBillButton.textContent = "✕ Cancel Complete Bill";
}

/* =========================================================
   CANCEL COMPLETE BILL
   ========================================================= */

async function cancelCompleteBill() {
  if (currentOrderId === null || currentOrderId === undefined) {
    return;
  }

  if (currentBillIsOldBill) {
    alert("Old bills cannot be cancelled.");

    return;
  }

  const status = getBillStatus(currentBill);

  if (status === "PAID" || status === "COMPLETED" || currentBill?.paymentTime) {
    alert("Paid bill cannot be cancelled.");

    return;
  }

  if (status === "CANCELLED") {
    alert("This bill is already cancelled.");

    return;
  }

  const confirmed = confirm(
    `Are you sure you want to cancel the complete Order #${currentOrderId}?\n\nEvery item in this bill will be cancelled.\n\nThis action cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  cancelCompleteBillButton.disabled = true;

  cancelCompleteBillButton.textContent = "Cancelling...";

  try {
    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/orders/${currentOrderId}/cancel`,
      {
        method: "PUT",
      },
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to cancel complete bill.");
    }

    alert(`Order #${currentOrderId} has been cancelled successfully.`);

    closeModal();

    await loadActiveBills();

    if (getSelectedTab() === "old") {
      await loadRecentBills(showAllOldBills);
    }
  } catch (error) {
    console.error("Complete bill cancellation error:", error);

    alert(error.message || "Unable to cancel complete bill.");

    updateCompleteCancelButton(currentBill, currentBillIsOldBill);
  }
}

/* =========================================================
   CANCEL INDIVIDUAL ITEM
   ========================================================= */

async function cancelBillItem(itemId) {
  if (currentOrderId === null || currentOrderId === undefined) {
    return;
  }

  const item = Array.isArray(currentBill?.items)
    ? currentBill.items.find(
        (billItem) => Number(billItem.itemId) === Number(itemId),
      )
    : null;

  if (!item) {
    alert("Order item could not be found.");

    return;
  }

  const status = String(item.status || "ORDER_PLACED").toUpperCase();

  if (status === "SERVED") {
    alert("SERVED items cannot be cancelled.");

    return;
  }

  if (status === "CANCELLED") {
    alert("This item is already cancelled.");

    return;
  }

  if (!["ORDER_PLACED", "PREPARING", "READY"].includes(status)) {
    alert("This item cannot be cancelled.");

    return;
  }

  const itemName = item.itemName || "this item";

  const confirmed = confirm(
    `Cancel "${itemName}" from Order #${currentOrderId}?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/orders/${currentOrderId}/items/${itemId}/cancel`,
      {
        method: "PUT",
      },
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to cancel item.");
    }

    alert(`${itemName} cancelled successfully.`);

    await openBill(currentOrderId, currentBillIsOldBill);

    await loadActiveBills();
  } catch (error) {
    console.error("Item cancellation error:", error);

    alert(error.message || "Unable to cancel item.");
  }
}

/* =========================================================
   PAYMENT
   ========================================================= */

async function processPayment() {
  if (!currentOrderId) {
    return;
  }

  const status = getBillStatus(currentBill);

  if (status === "PAID" || status === "COMPLETED" || currentBill?.paymentTime) {
    return;
  }

  if (status === "CANCELLED") {
    alert("Cancelled bill cannot be paid.");

    return;
  }

  const grandTotal = Number(currentBill?.grandTotal || 0);

  if (grandTotal <= 0) {
    alert("There are no billable READY or SERVED items to pay.");

    return;
  }

  const method = paymentMethod.value;

  const confirmed = confirm(
    `Mark Order #${currentOrderId} as PAID using ${formatStatus(
      method,
    )}?\n\nAmount: ₹${formatMoney(grandTotal)}`,
  );

  if (!confirmed) {
    return;
  }

  payButton.disabled = true;

  payButton.textContent = "Processing...";

  try {
    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/orders/${currentOrderId}/payment`,
      {
        method: "POST",

        body: JSON.stringify({
          paymentMethod: method,
        }),
      },
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Payment failed.");
    }

    /*
     * IMPORTANT:
     *
     * Do not create a payment timestamp
     * in the browser.
     *
     * The backend creates and saves the
     * official payment time.
     */

    await openBill(currentOrderId, false);

    await loadActiveBills();

    if (getSelectedTab() === "old") {
      if (hasActiveSearch()) {
        await searchOldBills();
      } else {
        await loadRecentBills(showAllOldBills);
      }
    }

    alert("Payment completed successfully.");
  } catch (error) {
    console.error("Payment error:", error);

    alert(error.message || "Unable to complete payment.");
  } finally {
    payButton.disabled = false;

    payButton.textContent = "✓ Mark as Paid";
  }
}

/* =========================================================
   OLD BILLS
   ========================================================= */

async function loadRecentBills(showAll = showAllOldBills) {
  showAllOldBills = Boolean(showAll);

  recentBillsTitle.textContent = showAllOldBills ? "ALL BILLS" : "RECENT BILLS";

  allBillsButton.textContent = showAllOldBills
    ? "Recent Bills"
    : "See All Bills";

  try {
    recentBillsContainer.innerHTML = `<div class="loading">
         Loading ${showAllOldBills ? "all" : "recent"} bills...
       </div>`;

    const response = await apiFetch(`${API_BASE_URL}/bill-desk/old-bills`);

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to load old bills.");
    }

    let bills = Array.isArray(result?.data) ? result.data : [];

    bills.sort(
      (a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0),
    );

    if (!showAllOldBills) {
      bills = bills.slice(0, RECENT_LIMIT);
    }

    displayRecentBills(bills);
  } catch (error) {
    console.error("Old bills error:", error);

    recentBillsContainer.innerHTML = `<div class="loading">
         Unable to load old bills.<br>
         ${escapeHtml(error.message)}
       </div>`;
  }
}

/* =========================================================
   DISPLAY OLD BILLS
   ========================================================= */

function displayRecentBills(bills) {
  if (!bills.length) {
    recentBillsContainer.innerHTML = `<div class="loading">
         No bills found.
       </div>`;

    return;
  }

  const table = document.createElement("table");

  table.className = "recent-table";

  table.innerHTML = `

    <thead>

      <tr>

        <th>
          Order ID
        </th>

        <th>
          Table
        </th>

        <th>
          Customer
        </th>

        <th>
          Contact
        </th>

        <th>
          Order Placed
        </th>

        <th>
          Payment Completed
        </th>

        <th>
          Amount
        </th>

        <th>
          Payment Method
        </th>

        <th>
          Status
        </th>

        <th>
          Actions
        </th>

      </tr>

    </thead>


    <tbody></tbody>

  `;

  const tbody = table.querySelector("tbody");

  bills.forEach((bill) => {
    const row = document.createElement("tr");

    /*
     * IMPORTANT:
     *
     * /bill-desk/old-bills now returns BillResponse.
     *
     * BillResponse uses:
     *
     *     orderId
     *
     * while the old Order object used:
     *
     *     id
     *
     * Keep the fallback to id so this remains
     * compatible with either response shape.
     */

    const billId = bill.orderId ?? bill.id;

    const status = getOrderStatus(bill);

    const isCancelled = status === "CANCELLED";

    const paymentTime = isCancelled ? "-" : formatDateTime(bill.paymentTime);

    const paymentMethodValue = isCancelled
      ? "-"
      : bill.paymentMethod
        ? formatStatus(bill.paymentMethod)
        : "-";

    const statusClass =
      status === "CANCELLED"
        ? "cancelled"
        : status === "PAID"
          ? "paid"
          : "pending";

    row.innerHTML = `

        <td>
          Order #${escapeHtml(billId)}
        </td>


        <td>
          Table ${escapeHtml(bill.tableNumber ?? "-")}
        </td>


        <td>
          ${escapeHtml(bill.customerName || "Walk-in Customer")}
        </td>


        <td>
          ${escapeHtml(bill.customerPhone || "-")}
        </td>


        <td>
          ${escapeHtml(formatDateTime(bill.orderTime))}
        </td>


        <td>
          ${escapeHtml(paymentTime)}
        </td>


        <td>
          ₹${formatMoney(getOrderAmount(bill))}
        </td>


        <td>
          ${escapeHtml(paymentMethodValue)}
        </td>


        <td>

          <span
            class="status-badge ${statusClass}"
          >
            ${escapeHtml(formatStatus(status))}
          </span>

        </td>


        <td>

          <button
            class="table-action view-action"
            type="button"
            title="View Bill"
          >
            ◉
          </button>


          <button
            class="table-action print-action"
            type="button"
            title="Print Bill"
          >
            🖨
          </button>

        </td>

      `;

    const buttons = row.querySelectorAll(".table-action");

    buttons[0].addEventListener("click", () => {
      openBill(billId, true);
    });

    buttons[1].addEventListener("click", () => {
      printBill(billId);
    });

    tbody.appendChild(row);
  });

  recentBillsContainer.innerHTML = "";

  recentBillsContainer.appendChild(table);
}

/* =========================================================
   SEARCH OLD BILLS
   ========================================================= */

async function searchOldBills() {
  const orderId = orderIdInput.value.trim();

  const tableNumber = tableNumberInput.value.trim();

  const date = dateInput.value;

  if (!orderId && !tableNumber && !date) {
    showSearchMessage("Enter at least one search value.", false, true);

    return;
  }

  searchButton.disabled = true;

  searchButton.textContent = "Searching...";

  try {
    recentBillsContainer.innerHTML = `<div class="loading">
         Searching bills...
       </div>`;

    const params = new URLSearchParams();

    if (orderId) {
      params.append("orderId", orderId);
    }

    if (tableNumber) {
      params.append("tableNumber", tableNumber);
    }

    if (date) {
      params.append("date", date);
    }

    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/old-bills?${params.toString()}`,
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to search bills.");
    }

    const bills = Array.isArray(result?.data) ? result.data : [];

    if (bills.length === 0) {
      showSearchMessage("No bills found.", false, false);

      recentBillsContainer.innerHTML = `<div class="loading">
           No bills found for the selected search.
         </div>`;

      return;
    }

    showSearchMessage(
      `${bills.length} bill${bills.length === 1 ? "" : "s"} found.`,
      true,
      false,
    );

    displayRecentBills(bills);
  } catch (error) {
    console.error("Search error:", error);

    showSearchMessage(error.message || "Unable to search bills.", false, true);
  } finally {
    searchButton.disabled = false;

    searchButton.textContent = "🔍 Search";
  }
}

/* =========================================================
   CLEAR SEARCH
   ========================================================= */

function clearSearch() {
  orderIdInput.value = "";

  tableNumberInput.value = "";

  dateInput.value = "";

  searchMessage.classList.add("hidden");

  showOldBillsTab();

  loadRecentBills(showAllOldBills);
}

/* =========================================================
   SEARCH MESSAGE
   ========================================================= */

function showSearchMessage(message, success, error) {
  searchMessage.textContent = message;

  searchMessage.className = "search-message";

  if (success) {
    searchMessage.classList.add("success");
  }

  if (error) {
    searchMessage.classList.add("error");
  }

  searchMessage.classList.remove("hidden");
}

/* =========================================================
   SEARCH CHECK
   ========================================================= */

function hasActiveSearch() {
  return Boolean(
    orderIdInput.value.trim() ||
    tableNumberInput.value.trim() ||
    dateInput.value,
  );
}

function handleSearchEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();

    searchOldBills();
  }
}

/* =========================================================
   PRINT
   ========================================================= */

async function printBill(orderId) {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/bill-desk/orders/${orderId}/bill`,
    );

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || "Unable to load bill.");
    }

    const bill = result.data;

    if (!bill) {
      throw new Error("Bill data is unavailable.");
    }

    const allItems = Array.isArray(bill.items) ? bill.items : [];

    const printableItems = allItems.filter((item) =>
      BILLABLE_STATUSES.includes(String(item.status || "").toUpperCase()),
    );

    const rows = printableItems
      .map((item) => {
        const total =
          item.totalPrice ??
          Number(item.price || 0) * Number(item.quantity || 0);

        return `

              <tr>

                <td>
                  ${escapeHtml(item.itemName || "-")}
                </td>

                <td>
                  ${escapeHtml(item.quantity ?? 0)}
                </td>

                <td>
                  ₹${formatMoney(item.unitPrice ?? item.price ?? 0)}
                </td>

                <td>
                  ₹${formatMoney(total)}
                </td>

              </tr>

            `;
      })
      .join("");

    const customerName = bill.customerName || "Walk-in Customer";

    const customerPhone = bill.customerPhone || "Not Provided";

    const paymentMethodValue = bill.paymentMethod
      ? formatStatus(bill.paymentMethod)
      : "Not Available";

    const paymentTime = bill.paymentTime
      ? formatDateTime(bill.paymentTime)
      : "Not Paid Yet";

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error("Unable to open print window. Please allow pop-ups.");
    }

    printWindow.document.write(`

      <!doctype html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Scan2Serve Bill #${escapeHtml(bill.orderId)}
        </title>


        <style>

          * {
            box-sizing: border-box;
          }


          body {
            margin: 0;

            padding: 30px;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #2d241e;

            background: #ffffff;
          }


          .receipt {
            width:
              min(
                760px,
                100%
              );

            margin: 0 auto;
          }


          .brand {
            text-align: center;

            color: #3a2418;

            font-size: 27px;

            font-weight: 700;

            letter-spacing: 1px;
          }


          .brand span {
            color: #c8792d;
          }


          .subtitle {
            margin-top: 5px;

            text-align: center;

            color: #765d49;

            font-size: 13px;
          }


          .header-line {
            margin:
              18px 0;

            border-top:
              2px solid
              #c58b45;
          }


          .info-grid {
            display: grid;

            grid-template-columns:
              1fr
              1fr;

            gap: 10px;

            margin-bottom: 15px;
          }


          .info-box {
            padding: 10px;

            border:
              1px solid
              #ddd;

            border-radius: 5px;
          }


          .info-label {
            color: #765d49;

            font-size: 10px;

            font-weight: 700;

            text-transform: uppercase;
          }


          .info-value {
            margin-top: 4px;

            color: #3a2418;

            font-size: 13px;

            font-weight: 700;
          }


          .time-info {
            margin:
              15px 0;

            padding: 12px;

            border:
              1px solid
              #ddd;
          }


          .time-row {
            display: flex;

            justify-content:
              space-between;

            gap: 20px;

            padding: 5px 0;

            font-size: 12px;
          }


          table {
            width: 100%;

            border-collapse:
              collapse;

                          margin-top: 20px;
          }


          th,
          td {
            padding: 9px;

            border:
              1px solid
              #ccc;

            text-align: left;

            font-size: 12px;
          }


          th {
            background: #f8efe3;

            color: #3a2418;
          }


          .note {
            margin-top: 15px;

            padding: 10px;

            background: #fff5e8;

            border-left:
              3px solid
              #c58b45;

            font-size: 11px;
          }


          .totals {
            width:
              330px;

            margin-left:
              auto;

            margin-top:
              22px;
          }


          .total-row {
            display: flex;

            justify-content:
              space-between;

            padding: 6px 0;

            font-size: 13px;
          }


          .grand {
            margin-top: 6px;

            padding-top: 10px;

            border-top:
              2px solid
              #3a2418;

            font-size: 18px;

            font-weight: 700;
          }


          .payment-box {
            margin-top: 18px;

            padding: 12px;

            background: #f8efe3;

            border:
              1px solid
              #e2cfb7;
          }


          .thank-you {
            margin-top: 35px;

            padding-top: 15px;

            text-align: center;

            border-top:
              1px solid
              #ddd;
          }


          .thank-you-main {
            font-size: 15px;

            font-weight: 700;
          }


          .thank-you-sub {
            margin-top: 5px;

            color: #765d49;

            font-size: 11px;
          }


          @media print {

            body {
              padding: 10px;
            }

          }

        </style>

      </head>


      <body>

        <div class="receipt">


          <div class="brand">
            SCAN<span>2</span>SERVE
          </div>


          <div class="subtitle">
            Restaurant Bill
          </div>


          <div class="header-line"></div>


          <div class="info-grid">


            <div class="info-box">

              <div class="info-label">
                Order ID
              </div>

              <div class="info-value">
                #${escapeHtml(bill.orderId)}
              </div>

            </div>


            <div class="info-box">

              <div class="info-label">
                Table
              </div>

              <div class="info-value">
                ${escapeHtml(bill.tableNumber ?? "-")}
              </div>

            </div>


            <div class="info-box">

              <div class="info-label">
                Customer Name
              </div>

              <div class="info-value">
                ${escapeHtml(customerName)}
              </div>

            </div>


            <div class="info-box">

              <div class="info-label">
                Contact
              </div>

              <div class="info-value">
                ${escapeHtml(customerPhone)}
              </div>

            </div>


          </div>


          <div class="time-info">


            <div class="time-row">

              <span>
                Order Placed
              </span>

              <strong>
                ${escapeHtml(formatDateTime(bill.orderTime))}
              </strong>

            </div>


            <div class="time-row">

              <span>
                Payment Completed
              </span>

              <strong>
                ${escapeHtml(paymentTime)}
              </strong>

            </div>


            <div class="time-row">

              <span>
                Payment Method
              </span>

              <strong>
                ${escapeHtml(paymentMethodValue)}
              </strong>

            </div>


          </div>


          <table>

            <thead>

              <tr>

                <th>
                  Item
                </th>

                <th>
                  Qty
                </th>

                <th>
                  Unit Price
                </th>

                <th>
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              ${
                rows ||
                `
                  <tr>

                    <td
                      colspan="4"
                      style="text-align:center"
                    >
                      No READY or SERVED
                      items available.
                    </td>

                  </tr>
                `
              }

            </tbody>

          </table>


          <div class="note">

            Only
            <strong>
              READY
            </strong>
            and
            <strong>
              SERVED
            </strong>
            items are included
            in the payable bill.

          </div>


          <div class="totals">


            <div class="total-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹${formatMoney(bill.subtotal)}
              </strong>

            </div>


            <div class="total-row">

              <span>
                GST (${Number(bill.gstPercentage ?? 5)}%)
              </span>

              <strong>
                ₹${formatMoney(bill.gst)}
              </strong>

            </div>


            <div class="total-row grand">

              <span>
                Grand Total
              </span>

              <strong>
                ₹${formatMoney(bill.grandTotal)}
              </strong>

            </div>


          </div>


          <div class="payment-box">

            <strong>
              Payment Status:
            </strong>

            ${escapeHtml(formatStatus(getBillStatus(bill)))}

          </div>


          <div class="thank-you">

            <div class="thank-you-main">
              Thank you for dining with us!
            </div>

            <div class="thank-you-sub">
              We hope to serve you again.
            </div>

          </div>


        </div>


        <script>

          window.onload = function() {

            window.print();

          };

        <\/script>

      </body>

      </html>

    `);

    printWindow.document.close();
  } catch (error) {
    console.error("Print error:", error);

    alert(error.message || "Unable to print bill.");
  }
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {
  billModal.classList.add("hidden");

  currentOrderId = null;

  currentBill = null;

  currentBillIsOldBill = false;
}

/* =========================================================
   HELPERS
   ========================================================= */

function hasToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

function getBillStatus(bill) {
  return String(
    bill?.status ?? bill?.orderStatus ?? bill?.paymentStatus ?? "",
  ).toUpperCase();
}

function getOrderStatus(order) {
  return String(
    order?.status ?? order?.orderStatus ?? order?.paymentStatus ?? "",
  ).toUpperCase();
}

function getOrderAmount(order) {
  return Number(
    order?.grandTotal ??
      order?.totalAmount ??
      order?.amount ??
      order?.subtotal ??
      0,
  );
}

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setButtonLoading(button, text) {
  if (!button) {
    return;
  }

  button.disabled = true;

  button.dataset.originalText = button.innerHTML;

  button.innerHTML = text;
}

function restoreButton(button, fallbackText) {
  if (!button) {
    return;
  }

  button.disabled = false;

  button.innerHTML = button.dataset.originalText || fallbackText;
}
