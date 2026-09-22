"use strict";

/*
=========================================================
SCAN2SERVE ADMIN DASHBOARD
Complete JavaScript
Built against the current Scan2Serve backend
=========================================================
*/

/* =======================================================
   CONFIG
======================================================= */

const API_BASE_URL = "https://scan2servee.onrender.com";

/* =======================================================
   STORAGE KEYS
======================================================= */

const TOKEN_KEY = "scan2serve_token";
const EMPLOYEE_KEY = "scan2serve_employee";

const KITCHEN_TOKEN_KEY = "scan2serve_kitchen_token";
const KITCHEN_EMPLOYEE_KEY = "scan2serve_kitchen_employee";

const ADMIN_SECTION_KEY = "scan2serve_admin_selected_section";

/* =======================================================
   SESSION
======================================================= */

const session = {
  token: null,
  employee: null,
  role: "",
};

/* =======================================================
   DATA
======================================================= */

let dashboardData = null;

let menuData = [];
let categoryData = [];
let tableData = [];
let orderData = [];
let employeeData = [];

let menuLoaded = false;
let categoryLoaded = false;
let tableLoaded = false;
let orderLoaded = false;
let employeeLoaded = false;
let settingsLoaded = false;

/* =======================================================
   CURRENT SECTION
======================================================= */

let currentSection = "dashboard";

/* =======================================================
   SEARCH VALUES
======================================================= */

let menuSearch = "";
let menuCategoryFilter = "";
let categorySearch = "";
let tableSearch = "";
let orderSearch = "";
let employeeSearch = "";

/* =======================================================
   DOM SHORTCUT
======================================================= */

function $(id) {
  return document.getElementById(id);
}

/* =======================================================
   BASIC HELPERS
======================================================= */

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}

function setValue(id, value) {
  const element = $(id);

  if (element) {
    element.value = value ?? "";
  }
}

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function escapeHtml(value) {
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

function normalizeStatus(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toUpperCase();
}

function normalizeRole(value) {
  return normalizeStatus(value).replace(/^ROLE_/, "");
}

/* =======================================================
   MONEY
======================================================= */

function formatMoney(value) {
  return numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function money(value) {
  return `₹${formatMoney(value)}`;
}

/* =======================================================
   DATE
======================================================= */

function formatDateTime(value) {
  if (!value) {
    return "—";
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

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getTodayText() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =======================================================
   INITIAL
======================================================= */

function getInitial(name) {
  const text = String(name || "").trim();

  if (!text) {
    return "A";
  }

  return text.charAt(0).toUpperCase();
}

/* =======================================================
   API RESPONSE
======================================================= */

function unwrapResponse(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function responseArray(response) {
  const data = unwrapResponse(response);

  return Array.isArray(data) ? data : [];
}

/* =======================================================
   ERROR
======================================================= */

function getErrorMessage(error, fallback = "Something went wrong.") {
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

/* =======================================================
   SESSION
======================================================= */

function saveSession(token, employee) {
  session.token = token;
  session.employee = employee || {};
  session.role = normalizeRole(employee?.role);

  localStorage.setItem(TOKEN_KEY, token);

  localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee || {}));

  /*
   * Existing Kitchen page uses separate keys.
   * Existing Bill Desk page uses the normal keys.
   */
  localStorage.setItem(KITCHEN_TOKEN_KEY, token);

  localStorage.setItem(KITCHEN_EMPLOYEE_KEY, JSON.stringify(employee || {}));
}

function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    session.token = null;
    session.employee = null;
    session.role = "";

    return false;
  }

  let employee = {};

  try {
    employee = JSON.parse(localStorage.getItem(EMPLOYEE_KEY) || "{}");
  } catch {
    employee = {};
  }

  session.token = token;
  session.employee = employee;
  session.role = normalizeRole(employee?.role);

  if (session.role !== "ADMIN") {
    clearSession();
    return false;
  }

  /*
   * Keep Kitchen session synchronized.
   */
  localStorage.setItem(KITCHEN_TOKEN_KEY, token);

  localStorage.setItem(KITCHEN_EMPLOYEE_KEY, JSON.stringify(employee));

  return true;
}

function clearSession() {
  session.token = null;
  session.employee = null;
  session.role = "";

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(EMPLOYEE_KEY);

  localStorage.removeItem(KITCHEN_TOKEN_KEY);

  localStorage.removeItem(KITCHEN_EMPLOYEE_KEY);

  localStorage.removeItem(ADMIN_SECTION_KEY);
}

/* =======================================================
   ROLE
======================================================= */

function isAdmin() {
  return session.role === "ADMIN";
}

function canUseOrders() {
  return ["ADMIN", "BILL_DESK", "KITCHEN"].includes(session.role);
}

function canUseBillDesk() {
  return ["ADMIN", "BILL_DESK"].includes(session.role);
}

function canUseKitchen() {
  return ["ADMIN", "KITCHEN"].includes(session.role);
}

/* =======================================================
   AUTHENTICATED API
======================================================= */

async function apiRequest(endpoint, options = {}) {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  /*
   * JSON body
   */
  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    typeof requestOptions.body !== "string"
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  /*
   * Content type
   */
  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestOptions.headers["Content-Type"]
  ) {
    requestOptions.headers["Content-Type"] = "application/json";
  }

  requestOptions.headers.Accept = "application/json";

  /*
   * JWT
   */
  if (session.token) {
    requestOptions.headers.Authorization = `Bearer ${session.token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
  } catch (error) {
    throw new Error(
      "Unable to connect to Scan2Serve backend. Make sure the Spring Boot server is running on port 8080.",
    );
  }

  /*
   * Unauthorized
   */
  if (response.status === 401) {
    clearSession();

    showLogin();

    throw new Error("Your session has expired. Please login again.");
  }

  /*
   * Forbidden
   */
  if (response.status === 403) {
    throw new Error(
      "Access denied. Your logged-in account does not have permission to use this feature.",
    );
  }

  /*
   * Parse response
   */
  let data = null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  /*
   * Other errors
   */
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : "") ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

/* =======================================================
   PUBLIC API
======================================================= */

async function publicApiRequest(endpoint, options = {}) {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    typeof requestOptions.body !== "string"
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
    requestOptions.headers["Content-Type"] = "application/json";
  }

  requestOptions.headers.Accept = "application/json";

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
  } catch {
    throw new Error("Unable to connect to Scan2Serve backend.");
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`,
    );
  }

  return data;
}

/* =======================================================
   LOGIN
======================================================= */

async function login(username, password) {
  const response = await publicApiRequest("/auth/login", {
    method: "POST",
    body: {
      username,
      password,
    },
  });

  const data = unwrapResponse(response);

  if (!data?.token) {
    throw new Error(
      "Login succeeded but no authentication token was returned.",
    );
  }

  if (!data?.employee) {
    throw new Error(
      "Login succeeded but employee information was not returned.",
    );
  }

  const role = normalizeRole(data.employee.role);

  if (role !== "ADMIN") {
    throw new Error(
      "This account cannot access the Admin Dashboard. Please use the appropriate employee login.",
    );
  }

  saveSession(data.token, data.employee);

  return data;
}

/* =======================================================
   LOGIN SCREEN
======================================================= */

function showLogin() {
  $("loginScreen")?.classList.remove("hidden");

  $("app")?.classList.add("hidden");
}

function showApp() {
  $("loginScreen")?.classList.add("hidden");

  $("app")?.classList.remove("hidden");
}

/* =======================================================
   LOGIN ERROR
======================================================= */

function showLoginError(message) {
  const element = $("loginError");

  if (!element) {
    return;
  }

  element.textContent = message;

  element.classList.remove("hidden");
}

function hideLoginError() {
  const element = $("loginError");

  if (!element) {
    return;
  }

  element.textContent = "";

  element.classList.add("hidden");
}

/* =======================================================
   LOGIN BUTTON
======================================================= */

function setLoginLoading(loading) {
  const button = $("loginButton");

  if (!button) {
    return;
  }

  button.disabled = loading;

  if (loading) {
    button.dataset.originalText = button.textContent;

    button.textContent = "Logging in...";
  } else {
    button.textContent = button.dataset.originalText || "Login";
  }
}

/* =======================================================
   USER INFORMATION
======================================================= */

function updateUserUI() {
  const employee = session.employee || {};

  const name = employee.name || employee.username || "Admin";

  const role = normalizeRole(employee.role) || "ADMIN";

  const initial = getInitial(name);

  setText("headerName", name);
  setText("headerRole", role);

  setText("sidebarAvatar", initial);

  setText("headerAvatar", initial);

  setText("currentDate", getTodayText());
}

/* =======================================================
   NAVIGATION PERMISSIONS
======================================================= */

function applyNavigationPermissions() {
  document.querySelectorAll(".sidebar-item").forEach((button) => {
    const roles = String(button.dataset.roles || "")
      .split(",")
      .map((role) => normalizeRole(role))
      .filter(Boolean);

    const allowed = roles.length === 0 || roles.includes(session.role);

    button.classList.toggle("hidden", !allowed);
  });

  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isAdmin());
  });
}

/* =======================================================
   SECTION TITLES
======================================================= */

const SECTION_TITLES = {
  dashboard: "Dashboard",
  menu: "Menu",
  categories: "Categories",
  tables: "Tables & QR",
  orders: "Orders",
  "bill-desk": "Bill Desk",
  kitchen: "Kitchen",
  employees: "Employees",
  settings: "Settings",
};

const SECTION_IDS = {
  dashboard: "dashboardSection",
  menu: "menuSection",
  categories: "categoriesSection",
  tables: "tablesSection",
  orders: "ordersSection",
  "bill-desk": "billDeskSection",
  kitchen: "kitchenSection",
  employees: "employeesSection",
  settings: "settingsSection",
};

/* =======================================================
   SECTION PERMISSION
======================================================= */

function canAccessSection(section) {
  switch (section) {
    case "dashboard":
      return isAdmin();

    case "menu":
    case "categories":
    case "tables":
    case "employees":
    case "settings":
      return isAdmin();

    case "orders":
      return canUseOrders();

    case "bill-desk":
      return canUseBillDesk();

    case "kitchen":
      return canUseKitchen();

    default:
      return false;
  }
}

/* =======================================================
   SWITCH SECTION
======================================================= */

function switchSection(section, save = true) {
  if (!canAccessSection(section)) {
    section = "dashboard";
  }

  currentSection = section;

  document.querySelectorAll(".page-section").forEach((element) => {
    element.classList.add("hidden");
  });

  const target = $(SECTION_IDS[section]);

  if (target) {
    target.classList.remove("hidden");
  }

  document.querySelectorAll(".sidebar-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });

  setText("pageTitle", SECTION_TITLES[section] || "Dashboard");

  if (save) {
    localStorage.setItem(ADMIN_SECTION_KEY, section);
  }

  closeMobileSidebar();

  loadSection(section);
}

/* =======================================================
   LOAD SECTION
======================================================= */

async function loadSection(section) {
  try {
    switch (section) {
      case "dashboard":
        await loadDashboard();

        break;

      case "menu":
        await loadMenu();

        break;

      case "categories":
        await loadCategories();

        break;

      case "tables":
        await loadTables();

        break;

      case "orders":
        await loadOrders();

        break;

      case "employees":
        await loadEmployees();

        break;

      case "settings":
        await loadSettings();

        break;

      case "bill-desk":
        loadBillDesk();

        break;

      case "kitchen":
        loadKitchen();

        break;
    }
  } catch (error) {
    console.error(`Failed loading ${section}:`, error);

    showToast(
      "Unable to load",
      getErrorMessage(error, `Unable to load ${section}.`),
      "error",
    );
  }
}

/* =======================================================
   DASHBOARD
======================================================= */

async function loadDashboard() {
  const response = await apiRequest("/admin/dashboard");

  const data = unwrapResponse(response);

  dashboardData = data || {};

  setText("totalOrders", numberValue(data?.totalOrders));

  setText("todayOrders", numberValue(data?.todayOrders));

  setText("activeOrders", numberValue(data?.activeOrders));

  setText("paidOrders", numberValue(data?.paidOrders));

  setText("todayRevenue", money(data?.todayRevenue));

  setText("summaryActive", numberValue(data?.activeOrders));

  setText("summaryPaid", numberValue(data?.paidOrders));

  setText("summaryCancelled", numberValue(data?.cancelledOrders));

  setText("summaryToday", numberValue(data?.todayOrders));

  setText("totalTables", numberValue(data?.totalTables));

  setText("availableTables", numberValue(data?.availableTables));

  setText("occupiedTables", numberValue(data?.occupiedTables));
}

/* =======================================================
   MENU
======================================================= */

async function loadMenu(force = false) {
  if (menuLoaded && !force) {
    ensureMenuCategoryFilter();
    renderMenu();

    return;
  }

  const response = await apiRequest("/admin/menu");

  menuData = responseArray(response);

  menuLoaded = true;

  if (!categoryLoaded) {
    try {
      await loadCategories(true);
    } catch (error) {
      console.warn("Unable to load categories for menu filter:", error);
    }
  }

  ensureMenuCategoryFilter();

  renderMenu();
}

/* =======================================================
   MENU CATEGORY NAME
======================================================= */

function getMenuCategoryName(menu) {
  if (menu?.category?.name) {
    return menu.category.name;
  }

  if (menu?.categoryName) {
    return menu.categoryName;
  }

  return "Uncategorized";
}

function ensureMenuCategoryFilter() {
  const searchBox = $("menuSearchInput");

  if (!searchBox) {
    return;
  }

  const toolbar = searchBox.closest(".toolbar");

  if (!toolbar) {
    return;
  }

  let filter = $("menuCategoryFilter");

  if (!filter) {
    filter = document.createElement("select");

    filter.id = "menuCategoryFilter";
    filter.className = "menu-category-filter";
    filter.setAttribute("aria-label", "Filter menu by category");

    const refreshButton = $("menuRefreshButton");

    if (refreshButton) {
      toolbar.insertBefore(filter, refreshButton);
    } else {
      toolbar.appendChild(filter);
    }

    filter.addEventListener("change", (event) => {
      menuCategoryFilter = event.target.value;
      renderMenu();
    });
  }

  const currentValue = menuCategoryFilter;

  filter.innerHTML = `
    <option value="">All Categories</option>
    ${categoryData
      .map(
        (category) => `
          <option value="${escapeHtml(category.id)}">
            ${escapeHtml(category.name)}
          </option>
        `,
      )
      .join("")}
  `;

  filter.value = currentValue;
}

/* =======================================================
   MENU IMAGE
======================================================= */

function getMenuImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  const url = String(imageUrl);

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return API_BASE_URL + url;
  }

  return url;
}

/* =======================================================
   RENDER MENU
======================================================= */

function renderMenu() {
  const tbody = $("menuTableBody");
  const empty = $("menuEmptyState");

  if (!tbody) {
    return;
  }

  const search = menuSearch.trim().toLowerCase();
  const categoryFilter = String(menuCategoryFilter || "");

  const filtered = menuData.filter((menu) => {
    if (categoryFilter) {
      const menuCategoryId = menu?.category?.id ?? menu?.categoryId ?? "";

      if (String(menuCategoryId) !== categoryFilter) {
        return false;
      }
    }

    if (!search) {
      return true;
    }

    return [menu.name, menu.description, getMenuCategoryName(menu)]
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  if (!filtered.length) {
    tbody.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");

  /*
   * Group menu items by category while preserving
   * the existing menu item order.
   */
  const groupedMenus = new Map();

  filtered.forEach((menu) => {
    const categoryName = getMenuCategoryName(menu);

    if (!groupedMenus.has(categoryName)) {
      groupedMenus.set(categoryName, []);
    }

    groupedMenus.get(categoryName).push(menu);
  });

  tbody.innerHTML = Array.from(groupedMenus.entries())
    .map(([categoryName, menus]) => {
      const categoryHeader = `
  <tr class="menu-category-spacer-row">
    <td colspan="5"></td>
  </tr>
  <tr class="menu-category-group-row">
    <td colspan="5">
      <strong>${escapeHtml(categoryName)}</strong>
    </td>
  </tr>
`;

      const menuRows = menus
        .map((menu) => {
          const image = getMenuImageUrl(menu.imageUrl);
          const available = menu.available === true;

          return `
            <tr>

              <td>
                <div class="table-item">

                  <div class="table-item-image">
                    ${
                      image
                        ? `
                          <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(menu.name)}"
                            loading="lazy"
                          >
                        `
                        : `
                          <span>🍽</span>
                        `
                    }
                  </div>

                  <div class="table-item-info">

                    <strong>
                      ${escapeHtml(menu.name)}
                    </strong>

                    <small>
                      ${escapeHtml(menu.description || "No description")}
                    </small>

                  </div>

                </div>
              </td>

              <td>
                ${escapeHtml(getMenuCategoryName(menu))}
              </td>

              <td class="amount-cell">
                ${money(menu.price)}
              </td>

              <td>
                <span class="status-badge ${
                  available ? "available" : "inactive"
                }">
                  ${available ? "Available" : "Unavailable"}
                </span>
              </td>

              <td class="actions-cell">

                <button
                  type="button"
                  class="table-action"
                  data-action="edit-menu"
                  data-id="${menu.id}"
                >
                  Edit
                </button>

                ${
                  available
                    ? `
                      <button
                        type="button"
                        class="table-action danger"
                        data-action="disable-menu"
                        data-id="${menu.id}"
                      >
                        Disable
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="table-action success"
                        data-action="enable-menu"
                        data-id="${menu.id}"
                      >
                        Enable
                      </button>
                    `
                }

              </td>

            </tr>
          `;
        })
        .join("");

      return categoryHeader + menuRows;
    })
    .join("");
}
/* =======================================================
   MENU MODAL
======================================================= */

async function openMenuModal(menuId = null) {
  let menu = null;

  if (menuId) {
    menu = menuData.find((item) => Number(item.id) === Number(menuId));

    if (!menu) {
      try {
        const response = await apiRequest(`/admin/menu/${menuId}`);

        menu = unwrapResponse(response);
      } catch (error) {
        showToast("Unable to load menu", getErrorMessage(error), "error");

        return;
      }
    }
  }

  if (!categoryLoaded) {
    try {
      await loadCategories(true);
    } catch (error) {
      console.error("Unable to load categories for menu modal:", error);
    }
  }

  const categoryOptions = categoryData
    .map((category) => {
      const selected = Number(category.id) === Number(menu?.category?.id);

      return `

                        <option
                            value="${category.id}"
                            ${selected ? "selected" : ""}
                        >
                            ${escapeHtml(category.name)}
                        </option>

                    `;
    })
    .join("");

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h3>
                            ${menu ? "Edit Menu Item" : "Add Menu Item"}
                        </h3>

                        <p>
                            Manage your restaurant menu item.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <form
                    id="menuForm"
                    class="modal-body"
                >

                    <div class="modal-form-grid">

                        <div class="form-group">

                            <label for="menuName">
                                Name
                            </label>

                            <input
                                id="menuName"
                                type="text"
                                required
                                value="${escapeHtml(menu?.name || "")}"
                            >

                        </div>


                        <div class="form-group">

                            <label for="menuPrice">
                                Price
                            </label>

                            <input
                                id="menuPrice"
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                value="${menu?.price ?? ""}"
                            >

                        </div>


                        <div class="form-group full-width">

                            <label for="menuDescription">
                                Description
                            </label>

                            <textarea
                                id="menuDescription"
                                required
                            >${escapeHtml(menu?.description || "")}</textarea>

                        </div>


                        <div class="form-group">

                            <label for="menuCategory">
                                Category
                            </label>

                            <select
                                id="menuCategory"
                                required
                            >

                                <option value="">
                                    Select category
                                </option>

                                ${categoryOptions}

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                Availability
                            </label>

                            <div class="checkbox-row">

                                <input
                                    id="menuAvailable"
                                    type="checkbox"
                                    ${
                                      menu?.available !== false ? "checked" : ""
                                    }
                                >

                                <label for="menuAvailable">
                                    Available for customers
                                </label>

                            </div>

                        </div>


                        <div class="form-group full-width">

                            <label for="menuImage">
                                Menu Image
                            </label>

                            <input
                                id="menuImage"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                            >

                            <small>
                                JPG, PNG, WEBP or GIF. Maximum 5 MB.
                            </small>

                        </div>

                    </div>

                </form>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        form="menuForm"
                        class="primary-btn"
                    >
                        ${menu ? "Save Changes" : "Create Menu Item"}
                    </button>

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("menuForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveMenu(menuId);
  });
}

/* =======================================================
   SAVE MENU
======================================================= */

async function saveMenu(menuId) {
  const name = $("menuName")?.value.trim();

  const description = $("menuDescription")?.value.trim();

  const price = Number($("menuPrice")?.value);

  const categoryId = Number($("menuCategory")?.value);

  const available = Boolean($("menuAvailable")?.checked);

  const image = $("menuImage")?.files?.[0];

  if (!name) {
    showToast("Validation", "Menu name is required.", "error");

    return;
  }

  if (!description) {
    showToast("Validation", "Description is required.", "error");

    return;
  }

  if (!Number.isFinite(price) || price <= 0) {
    showToast("Validation", "Price must be greater than 0.", "error");

    return;
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    showToast("Validation", "Please select a category.", "error");

    return;
  }

  const request = {
    name,
    description,
    price,
    available,
    categoryId,
  };

  try {
    let response;

    if (menuId) {
      response = await apiRequest(`/admin/menu/${menuId}`, {
        method: "PUT",
        body: request,
      });
    } else {
      response = await apiRequest("/admin/menu", {
        method: "POST",
        body: request,
      });
    }

    const savedMenu = unwrapResponse(response);

    /*
     * Image upload is a separate backend endpoint.
     */
    const savedMenuId = menuId || savedMenu?.id;

    if (image && savedMenuId) {
      const formData = new FormData();

      formData.append("image", image);

      await apiRequest(`/admin/menu/${savedMenuId}/image`, {
        method: "POST",
        body: formData,
      });
    }

    closeModal();

    menuLoaded = false;

    await loadMenu(true);

    showToast(
      "Success",
      menuId
        ? "Menu item updated successfully."
        : "Menu item created successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to save menu item", getErrorMessage(error), "error");
  }
}

/* =======================================================
   DISABLE MENU
======================================================= */

async function disableMenu(id) {
  /*
   * IMPORTANT:
   *
   * Backend DELETE /admin/menu/{id}
   * is a SOFT DELETE.
   *
   * It changes:
   *
   * available = false
   *
   * It does not physically remove the row.
   */

  if (!window.confirm("Disable this menu item?")) {
    return;
  }

  try {
    await apiRequest(`/admin/menu/${id}`, {
      method: "DELETE",
    });

    menuLoaded = false;

    await loadMenu(true);

    showToast("Menu updated", "Menu item disabled successfully.", "success");
  } catch (error) {
    showToast("Unable to disable menu item", getErrorMessage(error), "error");
  }
}

/* =======================================================
   ENABLE MENU
======================================================= */

async function enableMenu(id) {
  try {
    await apiRequest(`/admin/menu/enable/${id}`, {
      method: "PUT",
    });

    menuLoaded = false;

    await loadMenu(true);

    showToast("Menu updated", "Menu item enabled successfully.", "success");
  } catch (error) {
    showToast("Unable to enable menu item", getErrorMessage(error), "error");
  }
}

/* =======================================================
   CATEGORIES
======================================================= */

async function loadCategories(force = false) {
  if (categoryLoaded && !force) {
    renderCategories();

    return;
  }

  const response = await apiRequest("/admin/category");

  categoryData = responseArray(response);

  categoryLoaded = true;

  renderCategories();
}

/* =======================================================
   RENDER CATEGORIES
======================================================= */

function renderCategories() {
  const tbody = $("categoryTableBody");

  const empty = $("categoryEmptyState");

  if (!tbody) {
    return;
  }

  const search = categorySearch.trim().toLowerCase();

  const filtered = categoryData.filter((category) => {
    if (!search) {
      return true;
    }

    return String(category.name || "")
      .toLowerCase()
      .includes(search);
  });

  if (!filtered.length) {
    tbody.innerHTML = "";

    empty?.classList.remove("hidden");

    return;
  }

  empty?.classList.add("hidden");

  tbody.innerHTML = filtered
    .map(
      (category) => `

                    <tr>

                        <td>

                            <div class="table-item">

                                <div class="table-item-image">
                                    <span>📂</span>
                                </div>

                                <div class="table-item-info">

                                    <strong>
                                        ${escapeHtml(category.name)}
                                    </strong>

                                    <small>
                                        Category ID:
                                        ${escapeHtml(category.id)}
                                    </small>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(category.displayOrder)}
                        </td>


                        <td class="actions-cell">

                            <button
                                type="button"
                                class="table-action"
                                data-action="edit-category"
                                data-id="${category.id}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="table-action danger"
                                data-action="delete-category"
                                data-id="${category.id}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `,
    )
    .join("");
}

/* =======================================================
   CATEGORY MODAL
======================================================= */

function openCategoryModal(categoryId = null) {
  const category = categoryId
    ? categoryData.find((item) => Number(item.id) === Number(categoryId))
    : null;

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h3>
                            ${category ? "Edit Category" : "Add Category"}
                        </h3>

                        <p>
                            Manage menu categories.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <form
                    id="categoryForm"
                    class="modal-body"
                >

                    <div class="modal-form-grid">

                        <div class="form-group full-width">

                            <label for="categoryName">
                                Category Name
                            </label>

                            <input
                                id="categoryName"
                                type="text"
                                required
                                value="${escapeHtml(category?.name || "")}"
                            >

                        </div>


                        <div class="form-group full-width">

                            <label for="categoryDisplayOrder">
                                Display Order
                            </label>

                            <input
                                id="categoryDisplayOrder"
                                type="number"
                                min="0"
                                step="1"
                                value="${category?.displayOrder ?? 0}"
                            >

                        </div>

                    </div>

                </form>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        form="categoryForm"
                        class="primary-btn"
                    >
                        ${category ? "Save Changes" : "Create Category"}
                    </button>

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("categoryForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveCategory(categoryId);
  });
}

/* =======================================================
   SAVE CATEGORY
======================================================= */

async function saveCategory(categoryId) {
  const name = $("categoryName")?.value.trim();

  const displayOrder = Number($("categoryDisplayOrder")?.value);

  if (!name) {
    showToast("Validation", "Category name is required.", "error");

    return;
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    showToast(
      "Validation",
      "Display order must be a positive whole number or zero.",
      "error",
    );

    return;
  }

  const request = {
    name,
    displayOrder,
  };

  try {
    if (categoryId) {
      await apiRequest(`/admin/category/${categoryId}`, {
        method: "PUT",
        body: request,
      });
    } else {
      await apiRequest("/admin/category", {
        method: "POST",
        body: request,
      });
    }

    closeModal();

    categoryLoaded = false;

    await loadCategories(true);

    menuLoaded = false;

    showToast(
      "Success",
      categoryId
        ? "Category updated successfully."
        : "Category created successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to save category", getErrorMessage(error), "error");
  }
}

/* =======================================================
   DELETE CATEGORY
======================================================= */

async function deleteCategory(id) {
  const category = categoryData.find((item) => Number(item.id) === Number(id));

  if (!window.confirm(`Delete category "${category?.name || id}"?`)) {
    return;
  }

  try {
    await apiRequest(`/admin/category/${id}`, {
      method: "DELETE",
    });

    categoryLoaded = false;

    await loadCategories(true);

    menuLoaded = false;

    showToast("Deleted", "Category deleted successfully.", "success");
  } catch (error) {
    showToast("Unable to delete category", getErrorMessage(error), "error");
  }
}

/* =======================================================
   TABLES
======================================================= */

async function loadTables(force = false) {
  if (tableLoaded && !force) {
    renderTables();

    return;
  }

  const response = await apiRequest("/admin/tables");

  tableData = responseArray(response);

  tableLoaded = true;

  /*
   * Load orders as well so individual tables can
   * actually be identified as occupied.
   */
  if (!orderLoaded) {
    try {
      const orderResponse = await apiRequest("/admin/orders");

      orderData = responseArray(orderResponse);

      orderLoaded = true;
    } catch (error) {
      console.warn("Unable to load orders for table occupancy:", error);
    }
  }

  renderTables();
}

/* =======================================================
   ACTIVE TABLE NUMBERS
======================================================= */

function getOccupiedTableNumbers() {
  const occupied = new Set();

  orderData.forEach((order) => {
    const status = normalizeStatus(order.status);

    const active =
      status !== "" &&
      status !== "PAID" &&
      status !== "CANCELLED" &&
      status !== "CLOSED";

    if (
      active &&
      order.tableNumber !== null &&
      order.tableNumber !== undefined
    ) {
      occupied.add(Number(order.tableNumber));
    }
  });

  return occupied;
}

/* =======================================================
   TABLE STATUS
======================================================= */

function getTableStatus(table, occupiedNumbers) {
  if (table.active !== true) {
    return "INACTIVE";
  }

  if (occupiedNumbers.has(Number(table.tableNumber))) {
    return "OCCUPIED";
  }

  return "AVAILABLE";
}

/* =======================================================
   RENDER TABLES
======================================================= */

function renderTables() {
  const container = $("tablesContainer");

  const empty = $("tablesEmptyState");

  if (!container) {
    return;
  }

  const search = tableSearch.trim().toLowerCase();

  const filter = $("tableStatusFilter")?.value || "ALL";

  const occupiedNumbers = getOccupiedTableNumbers();

  const filtered = tableData.filter((table) => {
    const number = String(table.tableNumber ?? "");

    if (search && !number.toLowerCase().includes(search)) {
      return false;
    }

    const status = getTableStatus(table, occupiedNumbers);

    if (filter !== "ALL" && status !== filter) {
      return false;
    }

    return true;
  });

  if (!filtered.length) {
    container.innerHTML = "";

    empty?.classList.remove("hidden");

    return;
  }

  empty?.classList.add("hidden");

  container.innerHTML = filtered
    .map((table) => {
      const status = getTableStatus(table, occupiedNumbers);

      const active = table.active === true;

      return `

                        <article class="restaurant-table-card">

                            <div class="table-card-top">

                                <div>

                                    <div class="table-number">
                                        T-${escapeHtml(table.tableNumber)}
                                    </div>

                                    <div class="table-label">
                                        Table ID:
                                        ${escapeHtml(table.id)}
                                    </div>

                                </div>


                                <span class="status-badge ${
                                  active ? "available" : "inactive"
                                }">

                                    ${active ? "Active" : "Inactive"}

                                </span>

                            </div>


                            <div class="table-card-status">

                                <span class="status-badge ${
                                  status === "OCCUPIED"
                                    ? "occupied"
                                    : status === "AVAILABLE"
                                      ? "available"
                                      : "inactive"
                                }">

                                    ${
                                      status === "OCCUPIED"
                                        ? "Occupied"
                                        : status === "AVAILABLE"
                                          ? "Available"
                                          : "Inactive"
                                    }

                                </span>

                            </div>


                            <div class="table-card-actions">

                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="edit-table"
                                    data-id="${table.id}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="show-qr"
                                    data-id="${table.id}"
                                >
                                    QR
                                </button>


                                <button
                                    type="button"
                                    class="table-action danger"
                                    data-action="delete-table"
                                    data-id="${table.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </article>

                    `;
    })
    .join("");
}

/* =======================================================
   TABLE MODAL
======================================================= */

function openTableModal(tableId = null) {
  const table = tableId
    ? tableData.find((item) => Number(item.id) === Number(tableId))
    : null;

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h3>
                            ${table ? "Edit Table" : "Add Table"}
                        </h3>

                        <p>
                            Manage restaurant table information.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <form
                    id="tableForm"
                    class="modal-body"
                >

                    <div class="modal-form-grid">

                        <div class="form-group full-width">

                            <label for="tableNumber">
                                Table Number
                            </label>

                            <input
                                id="tableNumber"
                                type="number"
                                min="1"
                                step="1"
                                required
                                value="${table?.tableNumber ?? ""}"
                            >

                        </div>


                        <div class="form-group full-width">

                            <label>
                                Table Status
                            </label>


                            <div class="checkbox-row">

                                <input
                                    id="tableActive"
                                    type="checkbox"
                                    ${table?.active !== false ? "checked" : ""}
                                >


                                <label for="tableActive">
                                    Table is active
                                </label>

                            </div>

                        </div>

                    </div>

                </form>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        form="tableForm"
                        class="primary-btn"
                    >
                        ${table ? "Save Changes" : "Create Table"}
                    </button>

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("tableForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveTable(tableId);
  });
}

/* =======================================================
   SAVE TABLE
======================================================= */

async function saveTable(tableId) {
  const tableNumber = Number($("tableNumber")?.value);

  const active = Boolean($("tableActive")?.checked);

  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    showToast(
      "Validation",
      "Table number must be a positive whole number.",
      "error",
    );

    return;
  }

  const request = {
    tableNumber,
    active,
  };

  try {
    if (tableId) {
      await apiRequest(`/admin/tables/${tableId}`, {
        method: "PUT",
        body: request,
      });
    } else {
      await apiRequest("/admin/tables", {
        method: "POST",
        body: request,
      });
    }

    closeModal();

    tableLoaded = false;

    await loadTables(true);

    await loadDashboard();

    showToast(
      "Success",
      tableId ? "Table updated successfully." : "Table created successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to save table", getErrorMessage(error), "error");
  }
}

/* =======================================================
   DELETE TABLE
======================================================= */

async function deleteTable(id) {
  const table = tableData.find((item) => Number(item.id) === Number(id));

  if (!window.confirm(`Delete table T-${table?.tableNumber ?? id}?`)) {
    return;
  }

  try {
    await apiRequest(`/admin/tables/${id}`, {
      method: "DELETE",
    });

    tableLoaded = false;

    await loadTables(true);

    await loadDashboard();

    showToast("Deleted", "Table deleted successfully.", "success");
  } catch (error) {
    showToast("Unable to delete table", getErrorMessage(error), "error");
  }
}

/* =======================================================
   QR CODE
======================================================= */

async function showTableQr(tableId) {
  const table = tableData.find((item) => Number(item.id) === Number(tableId));

  if (!table) {
    return;
  }

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h3>
                            Table QR Code
                        </h3>

                        <p>
                            Table T-${escapeHtml(table.tableNumber)}
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <div class="modal-body qr-modal-content">

                    <div
                        id="qrImageWrapper"
                        class="qr-image-wrapper"
                    >

                        <div class="loading-spinner"></div>

                    </div>


                    <div class="qr-table-name">
                        Table T-${escapeHtml(table.tableNumber)}
                    </div>


                    <div class="qr-help">
                        Customers can scan this QR code
                        to open the restaurant menu.
                    </div>

                </div>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Close
                    </button>


                    <button
                        type="button"
                        class="primary-btn"
                        id="downloadQrButton"
                    >
                        Download QR
                    </button>

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("downloadQrButton")?.addEventListener("click", async () => {
    await downloadTableQr(table.id, table.tableNumber);
  });

  try {
    const blob = await fetchBinary(`/admin/table/${table.id}/qr`);

    const url = URL.createObjectURL(blob);

    const image = document.createElement("img");

    image.src = url;

    image.alt = `QR code for table ${table.tableNumber}`;

    image.width = 280;
    image.height = 280;

    const wrapper = $("qrImageWrapper");

    if (wrapper) {
      wrapper.innerHTML = "";

      wrapper.appendChild(image);
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  } catch (error) {
    const wrapper = $("qrImageWrapper");

    if (wrapper) {
      wrapper.innerHTML = `

                <div class="form-message error">

                    ${escapeHtml(
                      getErrorMessage(error, "Unable to generate QR code."),
                    )}

                </div>

            `;
    }
  }
}

/* =======================================================
   BINARY REQUEST
======================================================= */

async function fetchBinary(endpoint) {
  const headers = {};

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });
  } catch {
    throw new Error("Unable to connect to Scan2Serve backend.");
  }

  if (response.status === 401) {
    clearSession();

    showLogin();

    throw new Error("Your session has expired.");
  }

  if (response.status === 403) {
    throw new Error("Access denied.");
  }

  if (!response.ok) {
    throw new Error(`Unable to load resource (${response.status}).`);
  }

  return response.blob();
}

/* =======================================================
   DOWNLOAD QR
======================================================= */

async function downloadTableQr(tableId, tableNumber) {
  try {
    const blob = await fetchBinary(`/admin/table/${tableId}/qr/download`);

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `table-${tableNumber}-qr.png`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    showToast(
      "QR ready",
      `QR code for Table ${tableNumber} downloaded.`,
      "success",
    );
  } catch (error) {
    showToast("Unable to download QR", getErrorMessage(error), "error");
  }
}

/* =======================================================
   ORDERS
======================================================= */

async function loadOrders(force = false) {
  if (orderLoaded && !force) {
    renderOrderStatistics();
    renderOrders();

    return;
  }

  const response = await apiRequest("/admin/orders");

  orderData = responseArray(response);

  orderLoaded = true;

  renderOrderStatistics();
  renderOrders();
}

/* =======================================================
   ORDER STATISTICS
======================================================= */

function calculateOrderStatistics() {
  const total = orderData.length;

  const paid = orderData.filter(
    (order) => normalizeStatus(order.status) === "PAID",
  ).length;

  const cancelled = orderData.filter(
    (order) => normalizeStatus(order.status) === "CANCELLED",
  ).length;

  const active = orderData.filter((order) => {
    const status = normalizeStatus(order.status);

    return (
      status &&
      status !== "PAID" &&
      status !== "CANCELLED" &&
      status !== "CLOSED"
    );
  }).length;

  const today = orderData.filter((order) => isToday(order.orderTime)).length;

  return {
    total,
    paid,
    cancelled,
    active,
    today,
  };
}

// /* =======================================================
//    ORDER STATISTICS UI
// ======================================================= */

// function ensureOrderStatisticsUI() {
//   const section = $("ordersSection");

//   if (!section) {
//     return null;
//   }

//   let statistics = section.querySelector(".orders-statistics");

//   if (statistics) {
//     return statistics;
//   }

//   const panel = section.querySelector(".panel");

//   if (!panel) {
//     return null;
//   }

//   statistics = document.createElement("div");

//   statistics.className = "orders-statistics stats-grid";

//   statistics.innerHTML = `

//         <div class="stat-card">

//             <span class="stat-icon">
//                 📋
//             </span>

//             <div>

//                 <small>
//                     Total Orders
//                 </small>

//                 <strong
//                     id="ordersTotalCount"
//                 >
//                     0
//                 </strong>

//             </div>

//         </div>

//         <div class="stat-card">

//             <span class="stat-icon">
//                 ✓
//             </span>

//             <div>

//                 <small>
//                     Paid Orders
//                 </small>

//                 <strong
//                     id="ordersPaidCount"
//                 >
//                     0
//                 </strong>

//             </div>

//         </div>

//         <div class="stat-card">

//             <span class="stat-icon">
//                 !
//             </span>

//             <div>

//                 <small>
//                     Cancelled Orders
//                 </small>

//                 <strong
//                     id="ordersCancelledCount"
//                 >
//                     0
//                 </strong>

//             </div>

//         </div>

//         <div class="stat-card">

//             <span class="stat-icon">
//                 🔄
//             </span>

//             <div>

//                 <small>
//                     Active Orders
//                 </small>

//                 <strong
//                     id="ordersActiveCount"
//                 >
//                     0
//                 </strong>

//             </div>

//         </div>

//         <div class="stat-card">

//             <span class="stat-icon">
//                 📅
//             </span>

//             <div>

//                 <small>
//                     Today's Orders
//                 </small>

//                 <strong
//                     id="ordersTodayCount"
//                 >
//                     0
//                 </strong>

//             </div>

//         </div>

//     `;

//   /*
//    * Put the statistics immediately before
//    * the toolbar inside the Orders panel.
//    */
//   const toolbar = panel.querySelector(".toolbar");

//   if (toolbar) {
//     panel.insertBefore(statistics, toolbar);
//   } else {
//     panel.prepend(statistics);
//   }

//   return statistics;
// }

/* =======================================================
   RENDER ORDER STATISTICS
======================================================= */

function renderOrderStatistics() {
  const statistics = calculateOrderStatistics();

  /*
   * These IDs already exist in admin-dashboard.html.
   * We only update their values.
   *
   * We DO NOT create another statistics row.
   */

  setText("ordersTotalCount", statistics.total);

  setText("ordersPaidCount", statistics.paid);

  setText("ordersCancelledCount", statistics.cancelled);

  setText("ordersActiveCount", statistics.active);

  setText("ordersTodayCount", statistics.today);
}

/* =======================================================
   ORDER BADGE
======================================================= */

function orderStatusBadge(status) {
  const normalized = normalizeStatus(status);

  let className = "pending";

  if (normalized === "PAID") {
    className = "paid";
  } else if (normalized === "CANCELLED") {
    className = "cancelled";
  } else if (normalized === "PREPARING") {
    className = "preparing";
  } else if (normalized === "READY" || normalized === "SERVED") {
    className = "paid";
  } else if (normalized === "CLOSED") {
    className = "served";
  }

  const labels = {
    PENDING: "Pending",
    PREPARING: "Preparing",
    READY: "Ready",
    SERVED: "Served",
    PAID: "Paid",
    CANCELLED: "Cancelled",
    CLOSED: "Closed",
  };

  return `
    <span class="status-badge ${className}">
      ${escapeHtml(labels[normalized] || normalized || "Unknown")}
    </span>
  `;
}

/* =======================================================
   RENDER ORDERS
======================================================= */

function renderOrders() {
  const tbody = $("ordersTableBody");

  const empty = $("ordersEmptyState");

  if (!tbody) {
    return;
  }

  const search = orderSearch.trim().toLowerCase();

  const statusFilter = $("orderStatusFilter")?.value || "ALL";

  const filtered = orderData.filter((order) => {
    const status = normalizeStatus(order.status);

    if (statusFilter !== "ALL" && status !== statusFilter) {
      return false;
    }

    if (!search) {
      return true;
    }

    const values = [
      order.id,

      order.tableNumber,

      order.customerName,

      order.customerPhone,

      order.status,
    ];

    return values
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  if (!filtered.length) {
    tbody.innerHTML = "";

    empty?.classList.remove("hidden");

    return;
  }

  empty?.classList.add("hidden");

  /*
   * Newest orders first.
   */
  const sorted = [...filtered].sort((a, b) => {
    const first = new Date(a.orderTime || 0).getTime();

    const second = new Date(b.orderTime || 0).getTime();

    return second - first;
  });

  tbody.innerHTML = sorted
    .map((order) => {
      const status = normalizeStatus(order.status);

      return `

                        <tr>

                            <td>

                                <strong>
                                    #${escapeHtml(order.id)}
                                </strong>

                            </td>


                            <td>

                                ${
                                  order.tableNumber !== null &&
                                  order.tableNumber !== undefined
                                    ? `T-${escapeHtml(order.tableNumber)}`
                                    : "—"
                                }

                            </td>


                            <td>

                                <div class="table-item-info">

                                    <strong>
                                        ${escapeHtml(
                                          order.customerName || "Guest",
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                          order.customerPhone || "No phone",
                                        )}
                                    </small>

                                </div>

                            </td>


                            <td>
                                ${formatDateTime(order.orderTime)}
                            </td>


                            <td>
                                ${orderStatusBadge(status)}
                            </td>


                            <td class="amount-cell">
                                ${money(order.grandTotal)}
                            </td>


                            <td class="actions-cell">

                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="view-order"
                                    data-id="${order.id}"
                                >
                                    View
                                </button>

                            </td>

                        </tr>

                    `;
    })
    .join("");
}

/* =======================================================
   VIEW ORDER
======================================================= */

async function viewOrder(orderId) {
  let order = orderData.find((item) => Number(item.id) === Number(orderId));

  if (!order) {
    try {
      const response = await apiRequest(`/admin/orders/${orderId}`);

      order = unwrapResponse(response);
    } catch (error) {
      showToast("Unable to load order", getErrorMessage(error), "error");

      return;
    }
  }

  openOrderModal(order);
}

/* =======================================================
   ORDER ITEM NAME
======================================================= */

function getOrderItemName(item) {
  return item?.menu?.name || item?.menuName || item?.name || "Item";
}

/* =======================================================
   ORDER MODAL
======================================================= */

function openOrderModal(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  const itemHtml = items.length
    ? items
        .map((item) => {
          const unitPrice = numberValue(item.price ?? item.menu?.price);

          const quantity = numberValue(item.quantity);

          const total = unitPrice * quantity;

          return `

                            <div class="order-item-row">

                                <div>

                                    <strong>
                                        ${escapeHtml(getOrderItemName(item))}
                                    </strong>

                                    <small>
                                        ${quantity}
                                        ×
                                        ${money(unitPrice)}
                                    </small>

                                </div>


                                <span>
                                    ${orderStatusBadge(item.status)}
                                </span>


                                <strong>
                                    ${money(total)}
                                </strong>

                            </div>

                        `;
        })
        .join("")
    : `

                <div class="empty">

                    <div class="empty-icon">
                        🍽
                    </div>

                    <h3>
                        No order items
                    </h3>

                </div>

            `;

  const status = normalizeStatus(order.status);

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal large">

                <div class="modal-header">

                    <div>

                        <h3>
                            Order #${escapeHtml(order.id)}
                        </h3>

                        <p>
                            ${formatDateTime(order.orderTime)}
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <div class="modal-body">

                    <div class="order-details">


                        <div class="order-detail-header">

                            <div>

                                <div class="order-detail-number">
                                    #${escapeHtml(order.id)}
                                </div>


                                <div style="margin-top:8px;">
                                    ${orderStatusBadge(status)}
                                </div>

                            </div>


                            ${
                              isAdmin()
                                ? `

                                        <div>

                                            <label
                                                style="
                                                    display:block;
                                                    margin-bottom:6px;
                                                    font-size:11px;
                                                    font-weight:700;
                                                    color:#725f4e;
                                                "
                                            >
                                                Order Status
                                            </label>

                                            <select
                                                id="orderDetailStatus"
                                                style="
                                                    min-width:170px;
                                                    height:40px;
                                                    padding:0 10px;
                                                    border:1px solid #eadbc9;
                                                    border-radius:9px;
                                                    background:#fffaf3;
                                                "
                                            >

                                                ${[
                                                  "PENDING",
                                                  "PREPARING",
                                                  "READY",
                                                  "SERVED",
                                                  "PAID",
                                                  "CANCELLED",
                                                  "CLOSED",
                                                ]
                                                  .map(
                                                    (value) =>
                                                      `
                                                                <option
                                                                    value="${value}"
                                                                    ${
                                                                      status ===
                                                                      value
                                                                        ? "selected"
                                                                        : ""
                                                                    }
                                                                >
                                                                    ${value}
                                                                </option>
                                                            `,
                                                  )
                                                  .join("")}

                                            </select>

                                        </div>

                                      `
                                : ""
                            }

                        </div>


                        <div class="order-detail-meta">

                            <div class="detail-box">

                                <span>
                                    Table
                                </span>

                                <strong>
                                    ${
                                      order.tableNumber !== null &&
                                      order.tableNumber !== undefined
                                        ? `T-${escapeHtml(order.tableNumber)}`
                                        : "—"
                                    }
                                </strong>

                            </div>


                            <div class="detail-box">

                                <span>
                                    Customer
                                </span>

                                <strong>
                                    ${escapeHtml(order.customerName || "Guest")}
                                </strong>

                            </div>


                            <div class="detail-box">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    ${escapeHtml(order.customerPhone || "—")}
                                </strong>

                            </div>


                            <div class="detail-box">

                                <span>
                                    Order Date
                                </span>

                                <strong>
                                    ${formatDate(order.orderTime)}
                                </strong>

                            </div>

                        </div>


                        <div>

                            <span class="eyebrow">
                                ORDER ITEMS
                            </span>


                            <div
                                class="order-items"
                                style="margin-top:10px;"
                            >
                                ${itemHtml}
                            </div>

                        </div>


                        <div class="order-total-box">

                            <div class="order-total-row">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    ${money(order.subtotal)}
                                </strong>

                            </div>


                            <div class="order-total-row">

                                <span>
                                    GST
                                    ${
                                      order.gstPercentage !== null &&
                                      order.gstPercentage !== undefined
                                        ? `(${escapeHtml(
                                            order.gstPercentage,
                                          )}%)`
                                        : ""
                                    }
                                </span>

                                <strong>
                                    ${money(order.gst)}
                                </strong>

                            </div>


                            <div class="order-total-row grand-total">

                                <span>
                                    Grand Total
                                </span>

                                <strong>
                                    ${money(order.grandTotal)}
                                </strong>

                            </div>

                        </div>


                    </div>

                </div>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Close
                    </button>


                    ${
                      isAdmin()
                        ? `

                                <button
                                    type="button"
                                    class="primary-btn"
                                    id="saveOrderStatusButton"
                                    data-order-id="${order.id}"
                                >
                                    Update Status
                                </button>

                              `
                        : ""
                    }

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("saveOrderStatusButton")?.addEventListener("click", async () => {
    const newStatus = $("orderDetailStatus")?.value;

    await updateOrderStatus(order.id, newStatus);
  });
}

/* =======================================================
   UPDATE ORDER STATUS
======================================================= */

async function updateOrderStatus(orderId, status) {
  if (!status) {
    return;
  }

  try {
    await apiRequest(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: {
        status,
      },
    });

    closeModal();

    orderLoaded = false;

    await loadOrders(true);

    await loadDashboard();

    /*
     * Tables can change occupancy after an order
     * becomes PAID / CANCELLED / CLOSED.
     */
    tableLoaded = false;

    showToast(
      "Order updated",
      `Order #${orderId} is now ${status}.`,
      "success",
    );
  } catch (error) {
    showToast("Unable to update order", getErrorMessage(error), "error");
  }
}

/* =======================================================
   EMPLOYEES
======================================================= */

async function loadEmployees(force = false) {
  if (employeeLoaded && !force) {
    renderEmployees();

    return;
  }

  const response = await apiRequest("/admin/employees");

  employeeData = responseArray(response);

  employeeLoaded = true;

  renderEmployees();
}

/* =======================================================
   EMPLOYEE ROLE CLASS
======================================================= */

function getEmployeeRoleClass(role) {
  switch (normalizeRole(role)) {
    case "ADMIN":
      return "admin";

    case "BILL_DESK":
      return "bill-desk";

    case "KITCHEN":
      return "kitchen";

    default:
      return "";
  }
}

/* =======================================================
   RENDER EMPLOYEES
======================================================= */

function renderEmployees() {
  const tbody = $("employeeTableBody");

  const empty = $("employeeEmptyState");

  if (!tbody) {
    return;
  }

  const search = employeeSearch.trim().toLowerCase();

  const roleFilter = $("employeeRoleFilter")?.value || "";

  const statusFilter = $("employeeStatusFilter")?.value || "";

  const filtered = employeeData.filter((employee) => {
    const role = normalizeRole(employee.role);

    const active = employee.active === true;

    if (roleFilter && role !== roleFilter) {
      return false;
    }

    if (statusFilter === "active" && !active) {
      return false;
    }

    if (statusFilter === "inactive" && active) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [employee.name, employee.username, employee.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  if (!filtered.length) {
    tbody.innerHTML = "";

    empty?.classList.remove("hidden");

    return;
  }

  empty?.classList.add("hidden");

  tbody.innerHTML = filtered
    .map((employee) => {
      const role = normalizeRole(employee.role);

      const active = employee.active === true;

      return `

                        <tr>

                            <td>

                                <div class="table-item">

                                    <div class="table-item-image">
                                        <span>
                                            ${getInitial(
                                              employee.name ||
                                                employee.username,
                                            )}
                                        </span>
                                    </div>


                                    <div class="table-item-info">

                                        <strong>
                                            ${escapeHtml(
                                              employee.name || "Unnamed",
                                            )}
                                        </strong>

                                        <small>
                                            ID:
                                            ${escapeHtml(employee.id)}
                                        </small>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHtml(employee.username)}
                            </td>


                            <td>

                                <span class="status-badge ${getEmployeeRoleClass(
                                  role,
                                )}">
                                    ${escapeHtml(role)}
                                </span>

                            </td>


                            <td>

                                <span class="status-badge ${
                                  active ? "active" : "inactive"
                                }">

                                    ${active ? "Active" : "Inactive"}

                                </span>

                            </td>


                            <td class="actions-cell">

                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="edit-employee"
                                    data-id="${employee.id}"
                                >
                                    Edit
                                </button>


                                ${
                                  active
                                    ? `

                                            <button
                                                type="button"
                                                class="table-action"
                                                data-action="deactivate-employee"
                                                data-id="${employee.id}"
                                            >
                                                Deactivate
                                            </button>

                                          `
                                    : `

                                            <button
                                                type="button"
                                                class="table-action success"
                                                data-action="activate-employee"
                                                data-id="${employee.id}"
                                            >
                                                Activate
                                            </button>

                                          `
                                }


                                <button
                                    type="button"
                                    class="table-action danger"
                                    data-action="delete-employee"
                                    data-id="${employee.id}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `;
    })
    .join("");
}

/* =======================================================
   EMPLOYEE MODAL
======================================================= */

function openEmployeeModal(employeeId = null) {
  const employee = employeeId
    ? employeeData.find((item) => Number(item.id) === Number(employeeId))
    : null;

  const currentRole = normalizeRole(employee?.role);

  const html = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <div>

                        <h3>
                            ${employee ? "Edit Employee" : "Add Employee"}
                        </h3>

                        <p>
                            Manage staff accounts and permissions.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>


                <form
                    id="employeeForm"
                    class="modal-body"
                >

                    <div class="modal-form-grid">

                        <div class="form-group">

                            <label for="employeeName">
                                Name
                            </label>

                            <input
                                id="employeeName"
                                type="text"
                                required
                                value="${escapeHtml(employee?.name || "")}"
                            >

                        </div>


                        <div class="form-group">

                            <label for="employeeUsername">
                                Username
                            </label>

                            <input
                                id="employeeUsername"
                                type="text"
                                required
                                value="${escapeHtml(employee?.username || "")}"
                            >

                        </div>


                        <div class="form-group">

                            <label for="employeePassword">
                                Password
                            </label>

                            <input
                                id="employeePassword"
                                type="password"
                                ${employee ? "" : "required"}
                                placeholder="${
                                  employee
                                    ? "Leave blank to keep current password"
                                    : "Enter password"
                                }"
                            >

                        </div>


                        <div class="form-group">

                            <label for="employeeRole">
                                Role
                            </label>

                            <select
                                id="employeeRole"
                                required
                            >

                                <option
                                    value="ADMIN"
                                    ${currentRole === "ADMIN" ? "selected" : ""}
                                >
                                    Admin
                                </option>


                                <option
                                    value="BILL_DESK"
                                    ${
                                      currentRole === "BILL_DESK"
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    Bill Desk
                                </option>


                                <option
                                    value="KITCHEN"
                                    ${
                                      currentRole === "KITCHEN"
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    Kitchen
                                </option>

                            </select>

                        </div>


                        <div class="form-group full-width">

                            <label>
                                Account Status
                            </label>


                            <div class="checkbox-row">

                                <input
                                    id="employeeActive"
                                    type="checkbox"
                                    ${
                                      employee?.active !== false
                                        ? "checked"
                                        : ""
                                    }
                                >


                                <label for="employeeActive">
                                    Employee account is active
                                </label>

                            </div>

                        </div>

                    </div>

                </form>


                <div class="modal-footer">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-close-modal
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        form="employeeForm"
                        class="primary-btn"
                    >
                        ${employee ? "Save Changes" : "Create Employee"}
                    </button>

                </div>

            </div>

        </div>

    `;

  openModal(html);

  $("employeeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveEmployee(employeeId);
  });
}

/* =======================================================
   SAVE EMPLOYEE
======================================================= */

async function saveEmployee(employeeId) {
  const name = $("employeeName")?.value.trim();

  const username = $("employeeUsername")?.value.trim();

  const password = $("employeePassword")?.value;

  const role = $("employeeRole")?.value;

  const active = Boolean($("employeeActive")?.checked);

  if (!name) {
    showToast("Validation", "Employee name is required.", "error");

    return;
  }

  if (!username) {
    showToast("Validation", "Username is required.", "error");

    return;
  }

  if (!employeeId && !password) {
    showToast(
      "Validation",
      "Password is required when creating an employee.",
      "error",
    );

    return;
  }

  const request = {
    name,
    username,
    role,
    active,
  };

  /*
   * Password is optional on update.
   */
  if (password) {
    request.password = password;
  }

  try {
    if (employeeId) {
      await apiRequest(`/admin/employees/${employeeId}`, {
        method: "PUT",
        body: request,
      });
    } else {
      await apiRequest("/admin/employees", {
        method: "POST",
        body: request,
      });
    }

    closeModal();

    employeeLoaded = false;

    await loadEmployees(true);

    showToast(
      "Success",
      employeeId
        ? "Employee updated successfully."
        : "Employee created successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to save employee", getErrorMessage(error), "error");
  }
}

/* =======================================================
   ACTIVATE EMPLOYEE
======================================================= */

async function activateEmployee(id) {
  try {
    await apiRequest(`/admin/employees/${id}/activate`, {
      method: "PUT",
    });

    employeeLoaded = false;

    await loadEmployees(true);

    showToast(
      "Employee activated",
      "Employee account activated successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to activate employee", getErrorMessage(error), "error");
  }
}

/* =======================================================
   DEACTIVATE EMPLOYEE
======================================================= */

async function deactivateEmployee(id) {
  /*
   * Prevent accidentally deactivating yourself.
   */
  if (Number(session.employee?.id) === Number(id)) {
    showToast(
      "Action blocked",
      "You cannot deactivate the account you are currently using.",
      "error",
    );

    return;
  }

  if (!window.confirm("Deactivate this employee?")) {
    return;
  }

  try {
    await apiRequest(`/admin/employees/${id}/deactivate`, {
      method: "PUT",
    });

    employeeLoaded = false;

    await loadEmployees(true);

    showToast(
      "Employee deactivated",
      "Employee account deactivated successfully.",
      "success",
    );
  } catch (error) {
    showToast("Unable to deactivate employee", getErrorMessage(error), "error");
  }
}

/* =======================================================
   DELETE EMPLOYEE
======================================================= */

async function deleteEmployee(id) {
  if (Number(session.employee?.id) === Number(id)) {
    showToast(
      "Action blocked",
      "You cannot delete the account you are currently using.",
      "error",
    );

    return;
  }

  const employee = employeeData.find((item) => Number(item.id) === Number(id));

  if (!window.confirm(`Delete employee "${employee?.name || id}"?`)) {
    return;
  }

  try {
    await apiRequest(`/admin/employees/${id}`, {
      method: "DELETE",
    });

    employeeLoaded = false;

    await loadEmployees(true);

    showToast("Deleted", "Employee deleted successfully.", "success");
  } catch (error) {
    showToast("Unable to delete employee", getErrorMessage(error), "error");
  }
}

/* =======================================================
   SETTINGS
======================================================= */

async function loadSettings(force = false) {
  if (settingsLoaded && !force) {
    return;
  }

  const response = await apiRequest("/admin/settings");

  const settings = unwrapResponse(response);

  if (settings?.gstPercentage !== undefined) {
    setValue("gstInput", settings.gstPercentage);
  }

  settingsLoaded = true;
}

/* =======================================================
   SAVE GST
======================================================= */

async function saveGst(event) {
  event?.preventDefault();

  const gst = Number($("gstInput")?.value);

  if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
    showGstMessage("GST percentage must be between 0 and 100.", "error");

    return;
  }

  const button = $("gstSaveButton");

  if (button) {
    button.disabled = true;

    button.dataset.originalText = button.textContent;

    button.textContent = "Saving...";
  }

  try {
    const response = await apiRequest("/admin/settings/gst", {
      method: "PUT",
      body: {
        gstPercentage: gst,
      },
    });

    const settings = unwrapResponse(response);

    if (settings?.gstPercentage !== undefined) {
      setValue("gstInput", settings.gstPercentage);
    }

    settingsLoaded = true;

    showGstMessage("GST percentage saved successfully.", "success");

    showToast(
      "Settings saved",
      "GST percentage updated successfully.",
      "success",
    );
  } catch (error) {
    showGstMessage(
      getErrorMessage(error, "Unable to save GST settings."),
      "error",
    );
  } finally {
    if (button) {
      button.disabled = false;

      button.textContent = button.dataset.originalText || "Save GST";
    }
  }
}

/* =======================================================
   GST MESSAGE
======================================================= */

function showGstMessage(message, type) {
  const element = $("gstMessage");

  if (!element) {
    return;
  }

  element.textContent = message;

  element.className = `form-message ${type}`;
}

/* =======================================================
   BILL DESK
======================================================= */

function loadBillDesk() {
  if (!canUseBillDesk()) {
    return;
  }

  if (typeof window.initAdminBillDesk === "function") {
    window.initAdminBillDesk();
  }
}

/* =======================================================
   KITCHEN
======================================================= */

function loadKitchen() {
  if (!canUseKitchen()) {
    return;
  }

  if (typeof window.initAdminKitchen === "function") {
    window.initAdminKitchen();
  }
}

/* =======================================================
   REFRESH
======================================================= */

async function refreshCurrentSection() {
  switch (currentSection) {
    case "dashboard":
      await loadDashboard();

      break;

    case "menu":
      menuLoaded = false;

      await loadMenu(true);

      break;

    case "categories":
      categoryLoaded = false;

      await loadCategories(true);

      break;

    case "tables":
      tableLoaded = false;

      await loadTables(true);

      await loadDashboard();

      break;

    case "orders":
      orderLoaded = false;

      await loadOrders(true);

      await loadDashboard();

      break;

    case "employees":
      employeeLoaded = false;

      await loadEmployees(true);

      break;

    case "settings":
      settingsLoaded = false;

      await loadSettings(true);

      break;

    case "bill-desk":
      if (typeof window.initAdminBillDesk === "function") {
        await window.initAdminBillDesk();
      }

      break;

    case "kitchen":
      if (typeof window.initAdminKitchen === "function") {
        await window.initAdminKitchen();
      }

      break;
  }
}

/* =======================================================
   IFRAME RELOAD
======================================================= */

function reloadFrame(id) {
  const frame = $(id);

  if (!frame) {
    return;
  }

  const src = frame.getAttribute("src");

  if (src) {
    frame.src = src;
  }
}

/* =======================================================
   MOBILE SIDEBAR
======================================================= */

function openMobileSidebar() {
  $("adminSidebar")?.classList.add("mobile-open");

  $("sidebarOverlay")?.classList.add("active");
}

function closeMobileSidebar() {
  $("adminSidebar")?.classList.remove("mobile-open");

  $("sidebarOverlay")?.classList.remove("active");
}

/* =======================================================
   MODAL
======================================================= */

function openModal(html) {
  const root = $("modalRoot");

  if (!root) {
    return;
  }

  root.innerHTML = html;

  const backdrop = root.querySelector("[data-modal-backdrop]");

  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    });
  }

  root.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.body.style.overflow = "hidden";
}

function closeModal() {
  const root = $("modalRoot");

  if (root) {
    root.innerHTML = "";
  }

  document.body.style.overflow = "";
}

/* =======================================================
   TOAST
======================================================= */

function showToast(title, message, type = "info") {
  const container = $("toastContainer");

  if (!container) {
    return;
  }

  const icons = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i",
  };

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.innerHTML = `

        <div class="toast-icon">
            ${icons[type] || "i"}
        </div>


        <div class="toast-content">

            <strong>
                ${escapeHtml(title)}
            </strong>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";

    toast.style.transform = "translateX(15px)";

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3500);
}

/* =======================================================
   LOGOUT
======================================================= */

function logout() {
  if (!window.confirm("Are you sure you want to logout?")) {
    return;
  }

  clearSession();

  closeModal();

  closeMobileSidebar();

  showLogin();

  hideLoginError();

  if ($("loginUsername")) {
    $("loginUsername").value = "";
  }

  if ($("loginPassword")) {
    $("loginPassword").value = "";
  }
}

/* =======================================================
   EVENT HANDLERS
======================================================= */

function initializeEventHandlers() {
  /* -----------------------------------------------------
       LOGIN
    ----------------------------------------------------- */

  $("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = $("loginUsername")?.value.trim();

    const password = $("loginPassword")?.value;

    if (!username || !password) {
      showLoginError("Username and password are required.");

      return;
    }

    hideLoginError();

    setLoginLoading(true);

    try {
      const data = await login(username, password);

      updateUserUI();

      applyNavigationPermissions();

      showApp();

      const savedSection = localStorage.getItem(ADMIN_SECTION_KEY);

      const section =
        savedSection && canAccessSection(savedSection)
          ? savedSection
          : "dashboard";

      switchSection(section);

      $("loginForm")?.reset();
    } catch (error) {
      console.error("Login error:", error);

      showLoginError(getErrorMessage(error, "Unable to login."));
    } finally {
      setLoginLoading(false);
    }
  });

  /* -----------------------------------------------------
       PASSWORD
    ----------------------------------------------------- */

  $("passwordToggle")?.addEventListener("click", () => {
    const input = $("loginPassword");

    if (!input) {
      return;
    }

    if (input.type === "password") {
      input.type = "text";

      $("passwordToggle").textContent = "Hide";
    } else {
      input.type = "password";

      $("passwordToggle").textContent = "Show";
    }
  });

  /* -----------------------------------------------------
       NAVIGATION
    ----------------------------------------------------- */

  document.querySelectorAll(".sidebar-item").forEach((button) => {
    button.addEventListener("click", () => {
      switchSection(button.dataset.section);
    });
  });

  document.querySelectorAll("[data-go-section]").forEach((button) => {
    button.addEventListener("click", () => {
      switchSection(button.dataset.goSection);
    });
  });

  /* -----------------------------------------------------
       MOBILE
    ----------------------------------------------------- */

  $("mobileMenuButton")?.addEventListener("click", openMobileSidebar);

  $("sidebarOverlay")?.addEventListener("click", closeMobileSidebar);

  /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

  $("logoutButton")?.addEventListener("click", logout);

  $("headerLogoutButton")?.addEventListener("click", logout);

  /* -----------------------------------------------------
       DASHBOARD REFRESH
    ----------------------------------------------------- */

  $("refreshDashboardButton")?.addEventListener("click", async () => {
    try {
      await refreshCurrentSection();

      showToast("Refreshed", "Current data has been refreshed.", "success");
    } catch (error) {
      showToast("Refresh failed", getErrorMessage(error), "error");
    }
  });

  /* -----------------------------------------------------
       MENU
    ----------------------------------------------------- */

  $("addMenuButton")?.addEventListener("click", () => openMenuModal());

  $("menuRefreshButton")?.addEventListener("click", async () => {
    menuLoaded = false;

    await loadMenu(true);
  });

  $("menuSearchInput")?.addEventListener("input", (event) => {
    menuSearch = event.target.value;

    renderMenu();
  });

  /* -----------------------------------------------------
       CATEGORY
    ----------------------------------------------------- */

  $("addCategoryButton")?.addEventListener("click", () => openCategoryModal());

  $("categorySearchInput")?.addEventListener("input", (event) => {
    categorySearch = event.target.value;

    renderCategories();
  });

  /* -----------------------------------------------------
       TABLE
    ----------------------------------------------------- */

  $("addTableButton")?.addEventListener("click", () => openTableModal());

  $("tableSearchInput")?.addEventListener("input", (event) => {
    tableSearch = event.target.value;

    renderTables();
  });

  $("tableStatusFilter")?.addEventListener("change", renderTables);

  /* -----------------------------------------------------
       ORDERS
    ----------------------------------------------------- */

  $("ordersRefreshButton")?.addEventListener("click", async () => {
    try {
      orderLoaded = false;

      await loadOrders(true);

      await loadDashboard();

      showToast(
        "Orders refreshed",
        "Latest order data has been loaded.",
        "success",
      );
    } catch (error) {
      showToast("Unable to refresh orders", getErrorMessage(error), "error");
    }
  });

  $("orderSearchInput")?.addEventListener("input", (event) => {
    orderSearch = event.target.value;

    renderOrders();
  });

  $("orderStatusFilter")?.addEventListener("change", renderOrders);

  /* -----------------------------------------------------
       EMPLOYEES
    ----------------------------------------------------- */

  $("addEmployeeButton")?.addEventListener("click", () => openEmployeeModal());

  $("employeeSearchInput")?.addEventListener("input", (event) => {
    employeeSearch = event.target.value;

    renderEmployees();
  });

  $("employeeRoleFilter")?.addEventListener("change", renderEmployees);

  $("employeeStatusFilter")?.addEventListener("change", renderEmployees);

  /* -----------------------------------------------------
       SETTINGS
    ----------------------------------------------------- */

  $("gstForm")?.addEventListener("submit", saveGst);

  /* -----------------------------------------------------
       DATA ACTIONS
    ----------------------------------------------------- */

  document.addEventListener("click", handleAction);
}

/* =======================================================
   ACTION HANDLER
======================================================= */

async function handleAction(event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  const id = button.dataset.id;

  if (!id) {
    return;
  }

  switch (action) {
    case "edit-menu":
      await openMenuModal(id);

      break;

    case "disable-menu":
      await disableMenu(id);

      break;

    case "enable-menu":
      await enableMenu(id);

      break;

    case "edit-category":
      openCategoryModal(id);

      break;

    case "delete-category":
      await deleteCategory(id);

      break;

    case "edit-table":
      openTableModal(id);

      break;

    case "show-qr":
      await showTableQr(id);

      break;

    case "delete-table":
      await deleteTable(id);

      break;

    case "view-order":
      await viewOrder(id);

      break;

    case "edit-employee":
      openEmployeeModal(id);

      break;

    case "activate-employee":
      await activateEmployee(id);

      break;

    case "deactivate-employee":
      await deactivateEmployee(id);

      break;

    case "delete-employee":
      await deleteEmployee(id);

      break;
  }
}

/* =======================================================
   APPLICATION INITIALIZATION
======================================================= */

async function initializeApp() {
  /*
   * No session -> login.
   */
  if (!restoreSession()) {
    showLogin();

    return;
  }

  /*
   * Existing session.
   */
  updateUserUI();

  applyNavigationPermissions();

  showApp();

  const savedSection = localStorage.getItem(ADMIN_SECTION_KEY);

  const section =
    savedSection && canAccessSection(savedSection) ? savedSection : "dashboard";

  switchSection(section);
}

/* =======================================================
   GLOBAL ERROR HANDLERS
======================================================= */

window.addEventListener("error", (event) => {
  console.error("Scan2Serve Admin error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Scan2Serve Admin promise error:", event.reason);
});

/* =======================================================
   START
======================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeEventHandlers();

  initializeApp();
});
