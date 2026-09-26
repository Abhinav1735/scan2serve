(function () {
  "use strict";

  /* =========================================================
     SCAN2SERVE
     ADMIN BILL DESK
     ---------------------------------------------------------
     Native Bill Desk module for admin-dashboard.html.

     IMPORTANT:
     - Does NOT use bill-desk.js
     - Uses the Admin login session
     - Uses the same Bill Desk API endpoints/actions
     - Safe to initialize multiple times
     ========================================================= */

  const API_BASE_URL = "https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run";

  const TOKEN_KEY = "scan2serve_token";
  const TAB_KEY = "scan2serve_bill_desk_selected_tab";

  const RECENT_LIMIT = 10;

  const AUTO_REFRESH = 60 * 1000;

  const BILLABLE_STATUSES = ["READY", "SERVED"];

  let initialized = false;

  let autoRefreshStarted = false;

  let currentOrderId = null;

  let currentBill = null;

  let currentBillIsOldBill = false;

  let showAllOldBills = false;

  /* =========================================================
     DOM
     ========================================================= */

  const root = document.getElementById("billDeskSection");

  if (!root) {
    return;
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  const dashboardScreen = $("dashboardScreen");

  const activeBillsTab = $("activeBillsTab");

  const oldBillsTab = $("oldBillsTab");

  const activeBillsSection = $("activeBillsSection");

  const oldBillsSection = $("oldBillsSection");

  const activeBillsContainer = $("activeBillsContainer");

  const noActiveBills = $("noActiveBills");

  const activeBillCount = $("activeBillCount");

  const refreshActiveButton = $("refreshActiveButton");

  const orderIdInput = $("orderIdInput");

  const tableNumberInput = $("tableNumberInput");

  const dateInput = $("dateInput");

  const searchButton = $("searchButton");

  const clearButton = $("clearButton");

  const refreshRecentButton = $("refreshRecentButton");

  const searchMessage = $("searchMessage");

  const recentBillsContainer = $("recentBillsContainer");

  const recentBillsTitle = $("recentBillsTitle");

  const allBillsButton = $("allBillsButton");

  const billModal = $("billModal");

  const modalOverlay = $("modalOverlay");

  const closeModalButton = $("closeModalButton");

  const modalCloseBottomButton = $("modalCloseBottomButton");

  const modalLoading = $("modalLoading");

  const modalContent = $("modalContent");

  const modalError = $("modalError");

  const modalOrderInfo = $("modalOrderInfo");

  const modalOrderId = $("modalOrderId");

  const modalTableNumber = $("modalTableNumber");

  const modalCustomerName = $("modalCustomerName");

  const modalCustomerPhone = $("modalCustomerPhone");

  const modalOrderTime = $("modalOrderTime");

  const modalPaymentTime = $("modalPaymentTime");

  const modalBillStatus = $("modalBillStatus");

  const modalPaymentMethod = $("modalPaymentMethod");

  const modalBillItems = $("modalBillItems");

  const modalSubtotal = $("modalSubtotal");

  const modalGst = $("modalGst");

  const modalGstLabel = $("modalGstLabel");

  const modalGrandTotal = $("modalGrandTotal");

  const paymentSection = $("paymentSection");

  const paymentMethod = $("paymentMethod");

  const payButton = $("payButton");

  const paidMessage = $("paidMessage");

  const paidMessageTime = $("paidMessageTime");

  const cancelCompleteBillButton = $("cancelCompleteBillButton");

  const refreshBillButton = $("refreshBillButton");

  const printButton = $("printButton");

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  window.initAdminBillDesk = function () {
    if (!initialized) {
      setupEvents();

      initialized = true;
    }

    startAutoRefresh();

    showSelectedTab();

    loadActiveBills();

    if (getSelectedTab() === "old") {
      if (hasActiveSearch()) {
        searchOldBills();
      } else {
        loadRecentBills(showAllOldBills);
      }
    }
  };

  /* =========================================================
     EVENTS
     ========================================================= */

  function setupEvents() {
    if (activeBillsTab) {
      activeBillsTab.addEventListener("click", () => {
        saveSelectedTab("active");

        showActiveBillsTab();

        loadActiveBills();
      });
    }

    if (oldBillsTab) {
      oldBillsTab.addEventListener("click", () => {
        saveSelectedTab("old");

        showOldBillsTab();

        if (hasActiveSearch()) {
          searchOldBills();
        } else {
          loadRecentBills(showAllOldBills);
        }
      });
    }

    if (refreshActiveButton) {
      refreshActiveButton.addEventListener("click", async () => {
        setButtonLoading(refreshActiveButton, "↻ Refreshing...");

        try {
          await loadActiveBills();
        } finally {
          restoreButton(refreshActiveButton, "↻ Refresh");
        }
      });
    }

    if (searchButton) {
      searchButton.addEventListener("click", searchOldBills);
    }

    if (clearButton) {
      clearButton.addEventListener("click", clearSearch);
    }

    if (refreshRecentButton) {
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
    }

    if (allBillsButton) {
      allBillsButton.addEventListener("click", async () => {
        showAllOldBills = !showAllOldBills;

        await loadRecentBills(showAllOldBills);
      });
    }

    if (orderIdInput) {
      orderIdInput.addEventListener("keydown", handleSearchEnter);
    }

    if (tableNumberInput) {
      tableNumberInput.addEventListener("keydown", handleSearchEnter);
    }

    if (dateInput) {
      dateInput.addEventListener("keydown", handleSearchEnter);
    }

    if (closeModalButton) {
      closeModalButton.addEventListener("click", closeModal);
    }

    if (modalCloseBottomButton) {
      modalCloseBottomButton.addEventListener("click", closeModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", closeModal);
    }

    if (refreshBillButton) {
      refreshBillButton.addEventListener("click", async () => {
        if (currentOrderId === null || currentOrderId === undefined) {
          return;
        }

        setButtonLoading(refreshBillButton, "↻ Refreshing...");

        try {
          await openBill(currentOrderId, currentBillIsOldBill);
        } finally {
          restoreButton(refreshBillButton, "↻ Refresh Bill");
        }
      });
    }

    if (payButton) {
      payButton.addEventListener("click", processPayment);
    }

    if (printButton) {
      printButton.addEventListener("click", () => {
        if (currentOrderId !== null && currentOrderId !== undefined) {
          printBill(currentOrderId);
        }
      });
    }

    if (cancelCompleteBillButton) {
      cancelCompleteBillButton.addEventListener("click", cancelCompleteBill);
    }

    document.addEventListener("keydown", handleEscape);
  }

  function handleEscape(event) {
    if (
      event.key === "Escape" &&
      billModal &&
      !billModal.classList.contains("hidden")
    ) {
      closeModal();
    }
  }

  /* =========================================================
     AUTO REFRESH
     ========================================================= */

  function startAutoRefresh() {
    if (autoRefreshStarted) {
      return;
    }

    autoRefreshStarted = true;

    setInterval(async () => {
      if (!hasToken()) {
        return;
      }

      /*
       * Only refresh when the Admin Bill Desk section
       * actually exists and has been initialized.
       */
      if (!initialized) {
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
        console.error("Admin Bill Desk automatic refresh failed:", error);
      }
    }, AUTO_REFRESH);
  }

  /* =========================================================
     API
     ========================================================= */

  async function apiFetch(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      ...(options.headers || {}),
    };

    if (options.body && !headers["Content-Type"]) {
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
      throw new Error("Your session has expired. Please login again.");
    }

    return response;
  }

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
    if (activeBillsTab) {
      activeBillsTab.classList.add("active");
    }

    if (oldBillsTab) {
      oldBillsTab.classList.remove("active");
    }

    if (activeBillsSection) {
      activeBillsSection.classList.remove("hidden");
    }

    if (oldBillsSection) {
      oldBillsSection.classList.add("hidden");
    }
  }

  /* =========================================================
     OLD TAB
     ========================================================= */

  function showOldBillsTab() {
    if (oldBillsTab) {
      oldBillsTab.classList.add("active");
    }

    if (activeBillsTab) {
      activeBillsTab.classList.remove("active");
    }

    if (oldBillsSection) {
      oldBillsSection.classList.remove("hidden");
    }

    if (activeBillsSection) {
      activeBillsSection.classList.add("hidden");
    }
  }

  function showSelectedTab() {
    if (getSelectedTab() === "old") {
      showOldBillsTab();
    } else {
      showActiveBillsTab();
    }
  }

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

    if (!activeBillsContainer) {
      return;
    }

    activeBillsContainer.innerHTML = `
      <div class="loading">
        Loading active bills...
      </div>
    `;

    if (noActiveBills) {
      noActiveBills.classList.add("hidden");
    }

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

      if (activeBillCount) {
        activeBillCount.textContent = `${activeOrders.length} Active Bill${
          activeOrders.length === 1 ? "" : "s"
        }`;
      }

      if (activeOrders.length === 0) {
        activeBillsContainer.innerHTML = "";

        if (noActiveBills) {
          noActiveBills.classList.remove("hidden");
        }

        return;
      }

      displayActiveBills(activeOrders);
    } catch (error) {
      console.error("Admin active bills error:", error);

      activeBillsContainer.innerHTML = `
        <div class="loading">
          Unable to load active bills.<br>
          ${escapeHtml(error.message)}
        </div>
      `;
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

    if (!billModal) {
      return;
    }

    billModal.classList.remove("hidden");

    if (modalLoading) {
      modalLoading.classList.remove("hidden");
    }

    if (modalContent) {
      modalContent.classList.add("hidden");
    }

    if (modalError) {
      modalError.classList.add("hidden");
    }

    if (paidMessage) {
      paidMessage.classList.add("hidden");
    }

    if (modalOrderInfo) {
      modalOrderInfo.textContent = `Order #${orderId}`;
    }

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
      console.error("Admin open bill error:", error);

      if (modalLoading) {
        modalLoading.classList.add("hidden");
      }

      if (modalError) {
        modalError.textContent = error.message || "Unable to load bill.";

        modalError.classList.remove("hidden");
      }
    }
  }

  /* =========================================================
     DISPLAY BILL
     ========================================================= */

  function displayBill(bill, isOldBill) {
    if (modalLoading) {
      modalLoading.classList.add("hidden");
    }

    if (modalContent) {
      modalContent.classList.remove("hidden");
    }

    if (modalOrderId) {
      modalOrderId.textContent = bill.orderId ?? currentOrderId;
    }

    if (modalTableNumber) {
      modalTableNumber.textContent = bill.tableNumber ?? "-";
    }

    if (modalCustomerName) {
      modalCustomerName.textContent =
        bill.customerName && String(bill.customerName).trim()
          ? bill.customerName
          : "Walk-in Customer";
    }

    if (modalCustomerPhone) {
      modalCustomerPhone.textContent =
        bill.customerPhone && String(bill.customerPhone).trim()
          ? bill.customerPhone
          : "Not Provided";
    }

    if (modalOrderTime) {
      modalOrderTime.textContent = formatDateTime(bill.orderTime);
    }

    if (modalPaymentTime) {
      modalPaymentTime.textContent = bill.paymentTime
        ? formatDateTime(bill.paymentTime)
        : "Not Paid Yet";
    }

    const status = getBillStatus(bill);

    if (modalBillStatus) {
      modalBillStatus.textContent = formatStatus(status);
    }

    if (modalPaymentMethod) {
      modalPaymentMethod.textContent = bill.paymentMethod
        ? formatStatus(bill.paymentMethod)
        : "-";
    }

    if (modalOrderInfo) {
      modalOrderInfo.textContent = `Order #${bill.orderId ?? currentOrderId}`;
    }

    if (modalGstLabel) {
      modalGstLabel.textContent = `GST (${Number(bill.gstPercentage ?? 5)}%)`;
    }

    if (modalSubtotal) {
      modalSubtotal.textContent = `₹${formatMoney(bill.subtotal)}`;
    }

    if (modalGst) {
      modalGst.textContent = `₹${formatMoney(bill.gst)}`;
    }

    if (modalGrandTotal) {
      modalGrandTotal.textContent = `₹${formatMoney(bill.grandTotal)}`;
    }

    renderBillItems(bill, isOldBill);

    updatePaymentUI(bill, isOldBill);

    updateCompleteCancelButton(bill, isOldBill);
  }

  /* =========================================================
     BILL ITEMS
     ========================================================= */

  function renderBillItems(bill, isOldBill) {
    if (!modalBillItems) {
      return;
    }

    modalBillItems.innerHTML = "";

    const items = Array.isArray(bill.items) ? bill.items : [];

    if (items.length === 0) {
      modalBillItems.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="item-action-disabled"
            style="
              text-align:center;
              padding:30px;
            "
          >
            No items found.
          </td>
        </tr>
      `;

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

      /*
       * EXACT standalone cancellation rules:
       *
       * ORDER_PLACED -> can cancel
       * PREPARING    -> can cancel
       * READY        -> can cancel
       * SERVED       -> cannot cancel
       * CANCELLED    -> cannot cancel
       *
       * Old bills -> cannot cancel.
       */
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

        if (cancelButton) {
          cancelButton.addEventListener("click", () => {
            cancelBillItem(item.itemId);
          });
        }
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
      if (paymentSection) {
        paymentSection.classList.add("hidden");
      }

      if (paidMessage) {
        paidMessage.classList.remove("hidden");
      }

      if (paidMessageTime) {
        paidMessageTime.textContent = bill.paymentTime
          ? `Payment completed on ${formatDateTime(bill.paymentTime)}.`
          : "Payment completed successfully.";
      }

      return;
    }

    if (paidMessage) {
      paidMessage.classList.add("hidden");
    }

    if (isOldBill || isCancelled) {
      if (paymentSection) {
        paymentSection.classList.add("hidden");
      }
    } else {
      if (paymentSection) {
        paymentSection.classList.remove("hidden");
      }
    }
  }

  /* =========================================================
     COMPLETE BILL BUTTON
     ========================================================= */

  function updateCompleteCancelButton(bill, isOldBill) {
    if (!cancelCompleteBillButton) {
      return;
    }

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

    if (
      status === "PAID" ||
      status === "COMPLETED" ||
      currentBill?.paymentTime
    ) {
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
      /*
       * Same endpoint as standalone Bill Desk.
       */
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
      /*
       * EXACT standalone endpoint:
       *
       * PUT
       * /bill-desk/orders/{orderId}/items/{itemId}/cancel
       */
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

      /*
       * Reload the same modal so:
       * - item status updates
       * - bill amount recalculates
       * - GST recalculates
       * - grand total recalculates
       */
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

    if (
      status === "PAID" ||
      status === "COMPLETED" ||
      currentBill?.paymentTime
    ) {
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

    const method = paymentMethod ? paymentMethod.value : "CASH";

    const confirmed = confirm(
      `Mark Order #${currentOrderId} as PAID using ${formatStatus(
        method,
      )}?\n\nAmount: ₹${formatMoney(grandTotal)}`,
    );

    if (!confirmed) {
      return;
    }

    if (payButton) {
      payButton.disabled = true;

      payButton.textContent = "Processing...";
    }

    try {
      /*
       * EXACT standalone payment endpoint.
       *
       * POST
       * /bill-desk/orders/{orderId}/payment
       *
       * Body:
       * {
       *   paymentMethod: method
       * }
       */
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
       * Do NOT create paymentTime
       * in the browser.
       *
       * The backend creates the
       * official payment completion time.
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
      if (payButton) {
        payButton.disabled = false;

        payButton.textContent = "✓ Mark as Paid";
      }
    }
  }

  /* =========================================================
     OLD / RECENT BILLS
     ========================================================= */

  async function loadRecentBills(showAll = showAllOldBills) {
    showAllOldBills = Boolean(showAll);

    if (recentBillsTitle) {
      recentBillsTitle.textContent = showAllOldBills
        ? "ALL BILLS"
        : "RECENT BILLS";
    }

    if (allBillsButton) {
      allBillsButton.textContent = showAllOldBills
        ? "Recent Bills"
        : "See All Bills";
    }

    if (!recentBillsContainer) {
      return;
    }

    try {
      recentBillsContainer.innerHTML = `
        <div class="loading">
          Loading ${showAllOldBills ? "all" : "recent"} bills...
        </div>
      `;

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

      recentBillsContainer.innerHTML = `
        <div class="loading">
          Unable to load old bills.<br>
          ${escapeHtml(error.message)}
        </div>
      `;
    }
  }

  /* =========================================================
     DISPLAY RECENT / OLD BILLS
     ========================================================= */

  function displayRecentBills(bills) {
    if (!bills.length) {
      recentBillsContainer.innerHTML = `
      <div class="loading">
        No bills found.
      </div>
    `;

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
       * BillResponse uses orderId.
       *
       * Keep id as fallback for
       * compatibility.
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
          : status === "PAID" || status === "COMPLETED"
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
    if (!orderIdInput || !tableNumberInput || !dateInput) {
      return;
    }

    const orderId = orderIdInput.value.trim();

    const tableNumber = tableNumberInput.value.trim();

    const date = dateInput.value;

    if (!orderId && !tableNumber && !date) {
      showSearchMessage("Enter at least one search value.", false, true);

      return;
    }

    if (searchButton) {
      searchButton.disabled = true;

      searchButton.textContent = "Searching...";
    }

    try {
      recentBillsContainer.innerHTML = `
        <div class="loading">
          Searching bills...
        </div>
      `;

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

        recentBillsContainer.innerHTML = `
          <div class="loading">
            No bills found for the selected search.
          </div>
        `;

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

      showSearchMessage(
        error.message || "Unable to search bills.",
        false,
        true,
      );
    } finally {
      if (searchButton) {
        searchButton.disabled = false;

        searchButton.textContent = "🔍 Search";
      }
    }
  }

  /* =========================================================
     CLEAR SEARCH
     ========================================================= */

  function clearSearch() {
    if (orderIdInput) {
      orderIdInput.value = "";
    }

    if (tableNumberInput) {
      tableNumberInput.value = "";
    }

    if (dateInput) {
      dateInput.value = "";
    }

    if (searchMessage) {
      searchMessage.classList.add("hidden");
    }

    showOldBillsTab();

    loadRecentBills(showAllOldBills);
  }

  /* =========================================================
     SEARCH MESSAGE
     ========================================================= */

  function showSearchMessage(message, success, error) {
    if (!searchMessage) {
      return;
    }

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
      (orderIdInput?.value || "").trim() ||
      (tableNumberInput?.value || "").trim() ||
      dateInput?.value,
    );
  }

  function handleSearchEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();

      searchOldBills();
    }
  }

  /* =========================================================
     PRINT BILL
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

      const bill = result?.data;

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
            Scan2Serve Bill #${escapeHtml(bill.orderId ?? orderId)}
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
              margin: 18px 0;

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

              text-transform:
                uppercase;
            }

            .info-value {
              margin-top: 4px;

              color: #3a2418;

              font-size: 13px;

              font-weight: 700;
            }

            .time-info {
              margin: 15px 0;

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
              background:
                #f8efe3;

              color: #3a2418;
            }

            .note {
              margin-top: 15px;

              padding: 10px;

              background:
                #fff5e8;

              border-left:
                3px solid
                #c58b45;

              font-size: 11px;
            }

            .totals {
              width: 330px;

              margin-left: auto;

              margin-top: 22px;
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

              background:
                #f8efe3;

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
                  #${escapeHtml(bill.orderId ?? orderId)}
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
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>

              </thead>


              <tbody>

                ${
                  rows ||
                  `
                    <tr>
                      <td
                        colspan="4"
                        style="
                          text-align:center
                        "
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
              <strong>READY</strong>
              and
              <strong>SERVED</strong>
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
            window.onload = function () {
              window.print();
            };
          <\/script>

        </body>

        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error("Admin print error:", error);

      alert(error.message || "Unable to print bill.");
    }
  }

  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  function closeModal() {
    if (billModal) {
      billModal.classList.add("hidden");
    }

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
})();
