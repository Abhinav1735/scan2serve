"use strict";

/* =========================================================
   SCAN2SERVE - CUSTOMER BILL
========================================================= */

const API_URL = "https://p01--scan2serve-backend--ttjpyrf6rh7d.code.run";

/* =========================================================
   URL PARAMETERS
========================================================= */

const params = new URLSearchParams(window.location.search);

/* =========================================================
   GET ORDER ID
========================================================= */

function getOrderId() {
  return params.get("orderId");
}

/* =========================================================
   GET TABLE NUMBER
========================================================= */

function getTableNumber() {
  return params.get("table");
}

/* =========================================================
   STATUS TEXT
========================================================= */

function getStatusText(status) {
  switch (status) {
    case "ORDER_PLACED":
      return "Order Placed";

    case "PREPARING":
      return "Preparing";

    case "READY":
      return "Ready";

    case "SERVED":
      return "Served";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "Order Placed";
  }
}

/* =========================================================
   PAYMENT SUCCESS
========================================================= */

function showPaymentSuccess() {
  const existingMessage = document.getElementById("paymentSuccessMessage");

  if (existingMessage) {
    existingMessage.style.display = "flex";

    return;
  }

  const successMessage = document.createElement("div");

  successMessage.id = "paymentSuccessMessage";

  successMessage.className = "payment-success-message";

  successMessage.innerHTML = `

    <div class="payment-success-icon">
      ✓
    </div>

    <div class="payment-success-content">

      <h3>
        Payment Successful
      </h3>

      <p>
        Your payment has been completed successfully.
      </p>

    </div>

  `;

  const billContainer = document.querySelector(".bill-container");

  if (billContainer) {
    billContainer.insertBefore(successMessage, billContainer.firstChild);
  }
}

/* =========================================================
   HIDE PAYMENT SUCCESS
========================================================= */

function hidePaymentSuccess() {
  const successMessage = document.getElementById("paymentSuccessMessage");

  if (successMessage) {
    successMessage.style.display = "none";
  }
}

/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

function updatePaymentStatus(paymentStatus) {
  const status = String(paymentStatus || "").toUpperCase();

  console.log("Payment Status:", status);

  if (status === "PAID") {
    /*
     * Payment is complete.
     *
     * Clear only temporary browser session data.
     *
     * Customer name and phone stored in the database
     * remain untouched.
     */
    clearPaidOrderSession();

    showPaymentSuccess();
  } else {
    hidePaymentSuccess();
  }
}

/* =========================================================
   CLEAR PAID ORDER SESSION
========================================================= */

/*
 * Customer name and phone are permanently stored in the
 * database on the Order entity.
 *
 * We NEVER delete those database values here.
 *
 * Only the browser's temporary localStorage values are
 * cleared after this order is paid, so the next customer
 * using the same table can enter fresh details.
 *
 * We only clear the browser session when the current order
 * belongs to this paid bill. This prevents an old paid bill
 * from accidentally clearing details for a newer order.
 */
function clearPaidOrderSession() {
  const tableNumber = getTableNumber();

  const orderId = getOrderId();

  if (!tableNumber || !orderId) {
    return;
  }

  try {
    const currentOrderKey = "scan2serve_current_order_" + tableNumber;

    const customerKey = "scan2serve_customer_" + tableNumber;

    const savedOrderId = localStorage.getItem(currentOrderKey);

    /*
     * If there is a different active browser order for this
     * table, do not clear that newer customer's details.
     *
     * If there is no saved order ID, there is no current
     * browser order to protect, so clearing the customer
     * details is safe.
     */
    if (savedOrderId && String(savedOrderId) !== String(orderId)) {
      return;
    }

    localStorage.removeItem(customerKey);

    localStorage.removeItem(currentOrderKey);

    console.log("Paid order session cleared for table:", tableNumber);
  } catch (error) {
    console.warn("Could not clear paid order session:", error);
  }
}

/* =========================================================
   DISPLAY CUSTOMER INFORMATION
========================================================= */

function displayCustomerInformation(bill) {
  /*
   * Customer name and phone are stored
   * directly on the Order entity.
   */

  const customerNameElement = document.getElementById("customerName");

  const customerPhoneElement = document.getElementById("customerPhone");

  /*
   * Support both:
   *
   * bill.customerName
   * bill.customerPhone
   *
   * and possible nested customer data.
   */

  const customerName = bill.customerName ?? bill.customer?.name ?? "";

  const customerPhone = bill.customerPhone ?? bill.customer?.phone ?? "";

  const name = String(customerName).trim();

  const phone = String(customerPhone).trim();

  if (customerNameElement) {
    customerNameElement.textContent = name || "-";
  }

  if (customerPhoneElement) {
    customerPhoneElement.textContent = phone || "-";
  }
}

/* =========================================================
   GST LABEL
========================================================= */

function updateGstLabel(bill) {
  const gstLabel = document.getElementById("gstLabel");

  if (!gstLabel) {
    return;
  }

  /*
   * If the backend eventually sends
   * gstPercentage / gstRate, display it.
   *
   * Otherwise simply display "GST".
   */

  const gstPercentage = bill.gstPercentage ?? bill.gstRate;

  const percentage = Number(gstPercentage);

  if (Number.isFinite(percentage) && percentage >= 0) {
    gstLabel.textContent = `GST (${percentage}%)`;
  } else {
    gstLabel.textContent = "GST";
  }
}

/* =========================================================
   LOAD BILL
========================================================= */

async function loadBill() {
  const orderId = getOrderId();

  console.log("Loading bill for Order ID:", orderId);

  /* =======================================================
     CHECK ORDER ID
  ======================================================= */

  if (!orderId) {
    showError("Order ID is missing.");

    return;
  }

  try {
    /* =====================================================
       API URL
    ===================================================== */

    const url = `${API_URL}/customer/bill/${encodeURIComponent(orderId)}`;

    console.log("Request URL:", url);

    /* =====================================================
       API REQUEST
    ===================================================== */

    const response = await fetch(url);

    console.log("Response Status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    /* =====================================================
       JSON RESPONSE
    ===================================================== */

    const result = await response.json();

    console.log("Bill API Response:", result);

    /* =====================================================
       RESPONSE VALIDATION
    ===================================================== */

    if (!result || result.success !== true) {
      throw new Error(result?.message || "Unable to generate bill.");
    }

    const bill = result.data;

    if (!bill) {
      throw new Error("Bill data was not returned.");
    }

    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    updatePaymentStatus(bill.paymentStatus);

    /* =====================================================
       ORDER INFORMATION
    ===================================================== */

    const orderIdElement = document.getElementById("orderId");

    const tableNumberElement = document.getElementById("tableNumber");

    if (orderIdElement) {
      orderIdElement.textContent = bill.orderId ?? orderId;
    }

    if (tableNumberElement) {
      tableNumberElement.textContent =
        bill.tableNumber ?? getTableNumber() ?? "-";
    }

    /* =====================================================
       CUSTOMER INFORMATION
    ===================================================== */

    displayCustomerInformation(bill);

    /* =====================================================
       GST LABEL
    ===================================================== */

    updateGstLabel(bill);

    /* =====================================================
       BILL ITEMS
    ===================================================== */

    const billItems = document.getElementById("billItems");

    if (!billItems) {
      throw new Error("Bill items container is missing.");
    }

    billItems.innerHTML = "";

    const items = Array.isArray(bill.items) ? bill.items : [];

    /* =====================================================
       EMPTY BILL
    ===================================================== */

    if (items.length === 0) {
      const emptyRow = document.createElement("tr");

      emptyRow.innerHTML = `

        <td
          colspan="5"
          style="text-align:center;"
        >
          No bill items available.
        </td>

      `;

      billItems.appendChild(emptyRow);
    } else {
      /* ===================================================
         ITEMS
      =================================================== */

      const mergedServedItems = new Map();

      const displayItems = [];

      items.forEach((item) => {
        const status = String(item.status || "ORDER_PLACED").toUpperCase();

        /*
         * Merge only SERVED items with the same item name.
         */
        if (status === "SERVED") {
          const mergeKey = String(item.itemName || "")
            .trim()
            .toLowerCase();

          if (mergedServedItems.has(mergeKey)) {
            const existingItem = mergedServedItems.get(mergeKey);

            existingItem.quantity += Number(item.quantity || 0);

            existingItem.totalPrice += Number(item.totalPrice || 0);

            return;
          }

          const servedItem = {
            ...item,
            quantity: Number(item.quantity || 0),
            totalPrice: Number(item.totalPrice || 0),
          };

          mergedServedItems.set(mergeKey, servedItem);

          displayItems.push(servedItem);

          return;
        }

        /*
         * All non-SERVED items remain separate.
         */
        displayItems.push(item);
      });

      displayItems.forEach((item) => {
        const row = document.createElement("tr");

        /* ===============================================
             ITEM VALUES
        =============================================== */

        const itemName = item.itemName || "Unnamed Item";

        const quantity = Number(item.quantity || 0);

        const unitPrice = Number(item.unitPrice || 0);

        const totalPrice = Number(item.totalPrice || 0);

        /* ===============================================
             STATUS
        =============================================== */

        const status = item.status || "ORDER_PLACED";

        const statusText = getStatusText(status);

        /* ===============================================
             ROW
        =============================================== */

        row.innerHTML = `

            <td>
              ${escapeHtml(itemName)}
            </td>

            <td>
              ${quantity}
            </td>

            <td>
              ₹${formatMoney(unitPrice)}
            </td>

            <td>
              ₹${formatMoney(totalPrice)}
            </td>

            <td>

              <span
                class="status-badge status-${escapeAttribute(status)}"
              >
                ${escapeHtml(statusText)}
              </span>

            </td>

          `;

        billItems.appendChild(row);
      });
    }

    /* =====================================================
       TOTALS
    ===================================================== */

    const subtotal = Number(bill.subtotal || 0);

    const gst = Number(bill.gst || 0);

    const grandTotal = Number(bill.grandTotal || 0);

    const subtotalElement = document.getElementById("subtotal");

    const gstElement = document.getElementById("gst");

    const grandTotalElement = document.getElementById("grandTotal");

    if (subtotalElement) {
      subtotalElement.textContent = formatMoney(subtotal);
    }

    if (gstElement) {
      gstElement.textContent = formatMoney(gst);
    }

    if (grandTotalElement) {
      grandTotalElement.textContent = formatMoney(grandTotal);
    }

    /* =====================================================
       SHOW BILL
    ===================================================== */

    const loading = document.getElementById("loading");

    const billContent = document.getElementById("billContent");

    const error = document.getElementById("error");

    if (loading) {
      loading.style.display = "none";
    }

    if (error) {
      error.style.display = "none";
    }

    if (billContent) {
      billContent.style.display = "block";
    }
  } catch (error) {
    console.error("Bill Error:", error);

    /*
     * Don't hide an already-loaded
     * bill because of a temporary
     * polling error.
     */

    const billContent = document.getElementById("billContent");

    if (!billContent || billContent.style.display !== "block") {
      showError(error.message || "Unable to load bill. Please try again.");
    }
  }
}

/* =========================================================
   SHOW ERROR
========================================================= */

function showError(message) {
  const loading = document.getElementById("loading");

  const error = document.getElementById("error");

  const billContent = document.getElementById("billContent");

  if (loading) {
    loading.style.display = "none";
  }

  if (billContent) {
    billContent.style.display = "none";
  }

  if (error) {
    error.textContent = message;

    error.style.display = "block";
  }
}

/* =========================================================
   BACK TO MENU
========================================================= */

function goToMenu() {
  const tableNumber = getTableNumber();

  if (tableNumber) {
    window.location.href = "menu.html?table=" + encodeURIComponent(tableNumber);
  } else {
    window.location.href = "menu.html";
  }
}

/* =========================================================
   AUTOMATIC BILL REFRESH
========================================================= */

setInterval(loadBill, 3000);

/* =========================================================
   FIRST LOAD
========================================================= */

window.addEventListener("load", loadBill);

/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toFixed(2);
}

/* =========================================================
   HTML ESCAPE
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
   ATTRIBUTE ESCAPE
========================================================= */

function escapeAttribute(value) {
  return escapeHtml(value);
}
