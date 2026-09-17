"use strict";

/* =========================================================
   SCAN2SERVE - ROLE LOGIN
   ========================================================= */

/* =========================================================
   ROLE OPTIONS
   ========================================================= */

const roleOptions = document.querySelectorAll(".role-option");

/* =========================================================
   ROLE DESTINATIONS
   ========================================================= */

const roleDestinations = {
  admin: "admin-dashboard.html",

  kitchen: "kitchen.html",

  "bill-desk": "bill-desk.html",
};

/* =========================================================
   ROLE CLICK HANDLER
   ========================================================= */

roleOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const role = option.dataset.role;

    if (!role) {
      return;
    }

    const destination = roleDestinations[role];

    if (!destination) {
      return;
    }

    window.location.href = destination;
  });
});
