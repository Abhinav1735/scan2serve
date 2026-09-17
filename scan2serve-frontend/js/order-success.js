// ============================
// Get Order Information
// ============================

const params = new URLSearchParams(window.location.search);

const orderId = params.get("orderId");

const tableNumber = params.get("table");

// ============================
// Display Order Information
// ============================

const orderInfo = document.getElementById("orderInfo");

if (orderId) {
  orderInfo.textContent =
    "Your Order #" + orderId + " has been placed successfully.";
} else {
  orderInfo.textContent = "Your order has been placed successfully.";
}

// ============================
// Bill Button
// ============================

const billButton = document.getElementById("billButton");

if (orderId) {
  // Keep both order ID and table number
  // when opening the bill.

  if (tableNumber) {
    billButton.href = "bill.html?orderId=" + orderId + "&table=" + tableNumber;
  } else {
    // Fallback if table number is missing

    billButton.href = "bill.html?orderId=" + orderId;
  }
} else {
  billButton.style.display = "none";
}
