/* ======================================
   BioBrain Navbar Script (FINAL FIXED)
====================================== */

document.addEventListener("DOMContentLoaded", function () {
  const userMenu = document.querySelector(".user-menu");
  const trigger = document.querySelector(".user-trigger");

  if (!userMenu || !trigger) return;

  /* Toggle Dropdown */
  trigger.addEventListener("click", function (e) {
    e.stopPropagation();

    const isActive = userMenu.classList.contains("active");

    // Close all first
    userMenu.classList.remove("active");

    // Open only if it was closed
    if (!isActive) {
      userMenu.classList.add("active");
    }
  });

  /* Close When Clicking Outside */
  document.addEventListener("click", function (e) {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("active");
    }
  });

  /* Close On ESC */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      userMenu.classList.remove("active");
    }
  });
});