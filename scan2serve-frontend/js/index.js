/* =========================================================
   SCAN2SERVE LANDING PAGE
   JAVASCRIPT
========================================================= */

"use strict";

const CUSTOMER_PAGE = "menu.html";


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function initializeMobileNavigation() {

    const button =
        document.getElementById("mobileMenuButton");

    const navigation =
        document.getElementById("mobileNav");

    if (!button || !navigation) {
        return;
    }

    button.addEventListener("click", function () {

        const isOpen =
            button.classList.toggle("active");

        navigation.classList.toggle("open");

        button.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });


    navigation
        .querySelectorAll("a")
        .forEach(function (link) {

            link.addEventListener("click", function () {

                button.classList.remove("active");

                navigation.classList.remove("open");

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function initializeSmoothScrolling() {

    document
        .querySelectorAll('a[href^="#"]')
        .forEach(function (link) {

            link.addEventListener("click", function (event) {

                const targetId =
                    this.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(targetId);

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

        });

}


/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function initializeActiveNavigation() {

    const sections =
        document.querySelectorAll("section[id]");

    const links =
        document.querySelectorAll(
            ".desktop-nav .nav-link"
        );

    if (
        !sections.length ||
        !links.length
    ) {
        return;
    }


    function updateActiveLink() {

        const position =
            window.scrollY + 180;

        let currentSection = "home";


        sections.forEach(function (section) {

            if (
                position >=
                section.offsetTop
            ) {
                currentSection =
                    section.id;
            }

        });


        links.forEach(function (link) {

            link.classList.toggle(
                "active",
                link.getAttribute("href") ===
                `#${currentSection}`
            );

        });

    }


    window.addEventListener(
        "scroll",
        updateActiveLink,
        {
            passive: true
        }
    );


    updateActiveLink();

}


/* =========================================================
   FOOTER YEAR
========================================================= */

function initializeCurrentYear() {

    const year =
        document.getElementById("currentYear");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


/* =========================================================
   TABLE QR REDIRECT
========================================================= */

/*
    Existing printed QR codes may point to:

        /?table=1

    or

        /?table=2

    etc.

    This keeps those QR codes working and redirects
    them to:

        /menu.html?table=N
*/

function handleTableRedirect() {

    const currentUrl =
        new URL(window.location.href);

    const tableNumber =
        currentUrl.searchParams.get("table");


    if (!tableNumber) {
        return;
    }


    const currentFile =
        window.location.pathname
            .split("/")
            .pop();


    const isIndex =
        currentFile === "" ||
        currentFile === "index.html";


    if (!isIndex) {
        return;
    }


    const customerUrl =
        new URL(
            CUSTOMER_PAGE,
            window.location.href
        );


    customerUrl.searchParams.set(
        "table",
        tableNumber
    );


    window.location.replace(
        customerUrl.toString()
    );

}


/* =========================================================
   HEADER SCROLL EFFECT
========================================================= */

function initializeHeaderScroll() {

    const header =
        document.getElementById("siteHeader");

    if (!header) {
        return;
    }


    function updateHeader() {

        header.classList.toggle(
            "scrolled",
            window.scrollY > 20
        );

    }


    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    updateHeader();

}


/* =========================================================
   FREE BACKEND DEMO NOTICE
========================================================= */

function initializeDemoHostingNotice() {

    const overlay =
        document.getElementById("demoHostingOverlay");

    const closeButton =
        document.getElementById("demoHostingClose");

    const continueButton =
        document.getElementById("demoHostingContinue");


    if (
        !overlay ||
        !closeButton ||
        !continueButton
    ) {
        return;
    }


    function closeNotice() {

        overlay.classList.remove("active");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";
    }


    function openNotice() {

        overlay.classList.add("active");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";
    }


    closeButton.addEventListener(
        "click",
        closeNotice
    );


    continueButton.addEventListener(
        "click",
        closeNotice
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target === overlay
            ) {
                closeNotice();
            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                overlay.classList.contains("active")
            ) {
                closeNotice();
            }

        }
    );


    /*
     * Show once per browser session.
     * It will appear again when the browser
     * session is started again.
     */

    const noticeShown =
        sessionStorage.getItem(
            "scan2serveDemoNoticeShown"
        );


    if (!noticeShown) {

        setTimeout(
            function () {

                openNotice();

                sessionStorage.setItem(
                    "scan2serveDemoNoticeShown",
                    "true"
                );

            },
            700
        );
    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMobileNavigation();

        initializeSmoothScrolling();

        initializeActiveNavigation();

        initializeCurrentYear();

        initializeHeaderScroll();

        handleTableRedirect();

        initializeDemoHostingNotice();

        console.log(
            "Scan2Serve landing page initialized."
        );

    }
);