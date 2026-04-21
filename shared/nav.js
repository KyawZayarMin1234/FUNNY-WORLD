(() => {
  const nav = document.querySelector(".home-nav");
  const navLinks = nav?.querySelector(".home-nav-links");
  const navActions = nav?.querySelector(".nav-actions");
  if (!nav || !navLinks || !navActions) return;

  const mobileQuery = window.matchMedia("(max-width: 860px)");
  const navToggle = document.createElement("button");
  const navTargetId = navLinks.id || "primary-nav-links";
  navLinks.id = navTargetId;

  navToggle.type = "button";
  navToggle.className = "nav-toggle";
  navToggle.setAttribute("aria-label", "Open navigation menu");
  navToggle.setAttribute("aria-controls", navTargetId);
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.innerHTML = '<span class="nav-toggle-lines" aria-hidden="true"></span>';

  navActions.insertBefore(navToggle, navActions.firstChild || null);

  const isMobile = () => mobileQuery.matches;

  const setMenuState = (open) => {
    const shouldOpen = Boolean(open) && isMobile();
    nav.classList.toggle("is-open", shouldOpen);
    navToggle.setAttribute("aria-expanded", String(shouldOpen));
    navToggle.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    navLinks.setAttribute("aria-hidden", String(isMobile() ? !shouldOpen : false));
  };

  const closeMenu = () => {
    if (!nav.classList.contains("is-open")) return;
    setMenuState(false);
  };

  navToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuState(!nav.classList.contains("is-open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  const profileButton = nav.querySelector(".nav-profile");
  const settingsButton = nav.querySelector(".nav-settings");

  profileButton?.addEventListener("click", closeMenu);
  settingsButton?.addEventListener("click", closeMenu);

  document.addEventListener("click", (event) => {
    if (!isMobile() || !nav.classList.contains("is-open")) return;
    if (nav.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenu();
  });

  const syncViewportState = () => {
    if (!isMobile()) {
      closeMenu();
      navLinks.setAttribute("aria-hidden", "false");
      return;
    }
    navLinks.setAttribute("aria-hidden", String(!nav.classList.contains("is-open")));
  };

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncViewportState);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(syncViewportState);
  }

  syncViewportState();
})();
