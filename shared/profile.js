(() => {
  const profileButton = document.querySelector(".nav-profile");
  const panel = document.getElementById("profile-panel");
  const overlay = document.getElementById("profile-overlay");
  if (!profileButton || !panel || !overlay) return;

  const loginButton = panel.querySelector("[data-profile-login]");
  const logoutButton = panel.querySelector("[data-profile-logout]");
  const hintEl = panel.querySelector(".profile-hint");
  const actionsEl = panel.querySelector(".profile-panel-actions");

  const form = overlay.querySelector("#profile-form");
  const nameInput = overlay.querySelector("#profile-name");
  const emojiGrid = overlay.querySelector("#profile-emoji-grid");
  const errorEl = overlay.querySelector("#profile-error");
  const closeButtons = overlay.querySelectorAll("[data-profile-close], [data-profile-cancel]");

  const previewAvatar = overlay.querySelector("[data-profile-preview-avatar]");
  const previewName = overlay.querySelector("[data-profile-preview-name]");

  const avatarEls = Array.from(document.querySelectorAll("[data-profile-avatar]"));
  const nameEls = Array.from(document.querySelectorAll("[data-profile-name]"));
  const markEls = Array.from(document.querySelectorAll("[data-profile-mark]"));

  const PROFILE_STORAGE_KEY = "fgh-profile";
  const HISTORY_STORAGE_KEY = "fgh-game-history";
  const HISTORY_LIMIT = 120;
  const HISTORY_PREVIEW_LIMIT = 24;
  const HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const EMOJIS = [
    { id: "spark", label: "Spark", emoji: "\u26A1" },
    { id: "blaze", label: "Blaze", emoji: "\uD83D\uDD25" },
    { id: "wave", label: "Wave", emoji: "\uD83C\uDF0A" },
    { id: "leaf", label: "Leaf", emoji: "\uD83C\uDF43" },
    { id: "nova", label: "Nova", emoji: "\u2728" },
    { id: "crown", label: "Crown", emoji: "\uD83D\uDC51" },
  ];

  const safeParse = (raw) => {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  };

  const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ").slice(0, 16);

  const buildHistoryKey = (name, emojiId) => {
    const normalizedName = normalizeName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "player";
    const normalizedEmoji = typeof emojiId === "string" && emojiId ? emojiId : "spark";
    return `${normalizedName}::${normalizedEmoji}`;
  };

  const normalizeProfile = (parsed) => {
    if (!parsed || typeof parsed !== "object") return null;
    const name = normalizeName(parsed.name);
    if (!name) return null;

    const emojiId =
      typeof parsed.emoji === "string"
        ? parsed.emoji
        : typeof parsed.sticker === "string"
        ? parsed.sticker
        : null;
    if (!emojiId) return null;

    const markValue = Number(parsed.mark);

    return {
      name,
      emoji: emojiId,
      mark: Number.isFinite(markValue) ? Math.max(0, Math.floor(markValue)) : 0,
      historyKey:
        typeof parsed.historyKey === "string" && parsed.historyKey
          ? parsed.historyKey
          : buildHistoryKey(name, emojiId),
    };
  };

  const loadProfile = () => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      return normalizeProfile(safeParse(raw));
    } catch (error) {
      return null;
    }
  };

  const saveProfile = (data) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const clearProfileStorage = () => {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const loadHistoryEntries = () => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = raw ? safeParse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((entry) => entry && typeof entry === "object");
    } catch (error) {
      return [];
    }
  };

  const saveHistoryEntries = (entries) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
    } catch (error) {
      // Ignore storage errors.
    }
  };

  let profile = loadProfile();
  if (profile) saveProfile(profile);

  const findEmoji = (emojiId) => EMOJIS.find((emoji) => emoji.id === emojiId) || EMOJIS[0];

  const applyEmoji = (el, emojiId) => {
    if (!el) return;
    const emoji = findEmoji(emojiId);
    el.classList.remove("emoji-placeholder");
    el.classList.add("emoji-avatar");
    el.textContent = emoji.emoji;
  };

  const applyPlaceholder = (el) => {
    if (!el) return;
    el.classList.add("emoji-avatar", "emoji-placeholder");
    el.textContent = "\uD83D\uDE42";
  };

  const createDashboardUi = () => {
    if (!actionsEl) return {};

    const dashboardButton = document.createElement("button");
    dashboardButton.type = "button";
    dashboardButton.className = "btn ghost profile-dashboard-btn";
    dashboardButton.textContent = "Dashboard";
    dashboardButton.hidden = true;
    dashboardButton.setAttribute("data-profile-dashboard", "");

    if (logoutButton) {
      actionsEl.insertBefore(dashboardButton, logoutButton);
    } else {
      actionsEl.appendChild(dashboardButton);
    }

    const dashboardOverlay = document.createElement("div");
    dashboardOverlay.className = "dashboard-overlay";
    dashboardOverlay.id = "dashboard-overlay";
    dashboardOverlay.setAttribute("aria-hidden", "true");
    dashboardOverlay.innerHTML = `
      <div class="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
        <div class="dashboard-header">
          <div>
            <div class="dashboard-kicker">Player Dashboard</div>
            <h2 id="dashboard-title">Game History</h2>
          </div>
          <button class="btn ghost" type="button" data-dashboard-close>Close</button>
        </div>
        <p class="dashboard-subtitle">Recent game activity saved in this browser with localStorage.</p>
        <div class="dashboard-summary">
          <article class="dashboard-stat">
            <span>Player</span>
            <strong data-dashboard-player>Guest</strong>
          </article>
          <article class="dashboard-stat">
            <span>Records</span>
            <strong data-dashboard-total>0</strong>
          </article>
          <article class="dashboard-stat">
            <span>Last Played</span>
            <strong data-dashboard-last>--</strong>
          </article>
        </div>
        <div class="dashboard-tools">
          <div class="dashboard-tools-copy">Each entry shows the game, action, and exact date and time.</div>
          <button class="btn ghost" type="button" data-dashboard-clear>Clear History</button>
        </div>
        <div class="dashboard-history" data-dashboard-history></div>
      </div>
    `;

    document.body.appendChild(dashboardOverlay);

    return {
      dashboardButton,
      dashboardOverlay,
      dashboardCloseButtons: dashboardOverlay.querySelectorAll("[data-dashboard-close]"),
      dashboardClearButton: dashboardOverlay.querySelector("[data-dashboard-clear]"),
      dashboardPlayerEl: dashboardOverlay.querySelector("[data-dashboard-player]"),
      dashboardTotalEl: dashboardOverlay.querySelector("[data-dashboard-total]"),
      dashboardLastEl: dashboardOverlay.querySelector("[data-dashboard-last]"),
      dashboardHistoryEl: dashboardOverlay.querySelector("[data-dashboard-history]"),
    };
  };

  const {
    dashboardButton,
    dashboardOverlay,
    dashboardCloseButtons,
    dashboardClearButton,
    dashboardPlayerEl,
    dashboardTotalEl,
    dashboardLastEl,
    dashboardHistoryEl,
  } = createDashboardUi();

  const getProfileHistory = () => {
    if (!profile?.historyKey) return [];
    return loadHistoryEntries().filter((entry) => entry.profileKey === profile.historyKey);
  };

  const formatHistoryTimestamp = (value) => {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "--";
    return HISTORY_DATE_FORMATTER.format(new Date(timestamp));
  };

  const closePanel = () => {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    profileButton.setAttribute("aria-expanded", "false");
  };

  const openPanel = () => {
    panel.classList.add("active");
    panel.setAttribute("aria-hidden", "false");
    profileButton.setAttribute("aria-expanded", "true");
  };

  const renderDashboard = () => {
    if (!dashboardHistoryEl || !dashboardPlayerEl || !dashboardTotalEl || !dashboardLastEl) return;

    const entries = getProfileHistory()
      .slice()
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    dashboardPlayerEl.textContent = profile?.name || "Guest";
    dashboardTotalEl.textContent = String(entries.length);
    dashboardLastEl.textContent = entries.length ? formatHistoryTimestamp(entries[0].timestamp) : "--";
    dashboardHistoryEl.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "dashboard-empty";
      empty.textContent = "No game history yet. Start playing and your records will appear here.";
      dashboardHistoryEl.appendChild(empty);
      return;
    }

    entries.slice(0, HISTORY_PREVIEW_LIMIT).forEach((entry) => {
      const item = document.createElement("article");
      item.className = "dashboard-history-item";

      const top = document.createElement("div");
      top.className = "dashboard-history-top";

      const copy = document.createElement("div");
      copy.className = "dashboard-history-copy";

      const gameName = document.createElement("h3");
      gameName.className = "dashboard-history-game";
      gameName.textContent = entry.game || "Game";

      const action = document.createElement("p");
      action.className = "dashboard-history-action";
      action.textContent = entry.action || "Played";

      const time = document.createElement("time");
      time.className = "dashboard-history-time";
      time.textContent = formatHistoryTimestamp(entry.timestamp);

      copy.appendChild(gameName);
      copy.appendChild(action);
      top.appendChild(copy);
      top.appendChild(time);
      item.appendChild(top);

      if (entry.details) {
        const details = document.createElement("p");
        details.className = "dashboard-history-details";
        details.textContent = entry.details;
        item.appendChild(details);
      }

      dashboardHistoryEl.appendChild(item);
    });
  };

  const openDashboard = () => {
    if (!profile || !dashboardOverlay) return;
    renderDashboard();
    dashboardOverlay.classList.add("active");
    dashboardOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("dashboard-open");
    closePanel();
    const closeButton = dashboardOverlay.querySelector("[data-dashboard-close]");
    if (closeButton) closeButton.focus();
  };

  const closeDashboard = (restoreFocus = true) => {
    if (!dashboardOverlay) return;
    dashboardOverlay.classList.remove("active");
    dashboardOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dashboard-open");
    if (restoreFocus && dashboardButton && !dashboardButton.hidden) {
      dashboardButton.focus();
    }
  };

  const recordHistory = (payload = {}) => {
    if (!profile?.historyKey) return false;

    const game = typeof payload.game === "string" && payload.game.trim() ? payload.game.trim().slice(0, 60) : "Game";
    const action =
      typeof payload.action === "string" && payload.action.trim()
        ? payload.action.trim().slice(0, 40)
        : "Played";
    const details =
      typeof payload.details === "string" && payload.details.trim()
        ? payload.details.trim().replace(/\s+/g, " ").slice(0, 160)
        : "";

    const nextEntry = {
      id: `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      profileKey: profile.historyKey,
      profileName: profile.name,
      game,
      action,
      details,
      timestamp: Date.now(),
    };

    const nextEntries = [nextEntry, ...loadHistoryEntries()];
    saveHistoryEntries(nextEntries);
    if (dashboardOverlay?.classList.contains("active")) renderDashboard();
    return true;
  };

  const clearHistory = () => {
    if (!profile?.historyKey) return;
    const nextEntries = loadHistoryEntries().filter((entry) => entry.profileKey !== profile.historyKey);
    saveHistoryEntries(nextEntries);
    renderDashboard();
  };

  const clearError = () => {
    if (errorEl) errorEl.textContent = "";
  };

  const setError = (message) => {
    if (errorEl) errorEl.textContent = message;
  };

  const getSelectedEmoji = () => {
    if (!form) return null;
    const input = form.querySelector("input[name=\"profile-emoji\"]:checked");
    return input ? input.value : null;
  };

  const updatePreview = () => {
    if (previewName) {
      const value = nameInput ? nameInput.value.trim() : "";
      previewName.textContent = value || "Guest";
    }

    if (previewAvatar) {
      const selectedEmoji = getSelectedEmoji();
      if (selectedEmoji) {
        applyEmoji(previewAvatar, selectedEmoji);
      } else {
        applyPlaceholder(previewAvatar);
      }
    }
  };

  const buildEmojiGrid = () => {
    if (!emojiGrid) return;
    emojiGrid.innerHTML = "";

    EMOJIS.forEach((emoji) => {
      const label = document.createElement("label");
      label.className = "profile-emoji";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "profile-emoji";
      input.value = emoji.id;

      const avatar = document.createElement("span");
      avatar.className = "profile-emoji-avatar emoji-avatar";
      avatar.textContent = emoji.emoji;

      const text = document.createElement("span");
      text.className = "profile-emoji-name";
      text.textContent = emoji.label;

      label.appendChild(input);
      label.appendChild(avatar);
      label.appendChild(text);
      emojiGrid.appendChild(label);
    });
  };

  const renderProfile = () => {
    const name = profile?.name || "Guest";
    const mark = Number.isFinite(profile?.mark) ? profile.mark : 0;
    panel.classList.toggle("logged-in", Boolean(profile));

    nameEls.forEach((el) => {
      el.textContent = name;
    });

    markEls.forEach((el) => {
      el.textContent = String(mark);
    });

    avatarEls.forEach((el) => {
      if (profile?.emoji) {
        applyEmoji(el, profile.emoji);
      } else {
        applyPlaceholder(el);
      }
    });

    if (loginButton) {
      loginButton.textContent = "Guest Login";
      loginButton.hidden = Boolean(profile);
    }

    if (hintEl) {
      hintEl.hidden = Boolean(profile);
    }

    if (logoutButton) {
      logoutButton.disabled = !profile;
      logoutButton.setAttribute("aria-disabled", String(!profile));
    }

    if (dashboardButton) {
      dashboardButton.hidden = !profile;
      dashboardButton.disabled = !profile;
      dashboardButton.setAttribute("aria-hidden", String(!profile));
    }

    if (dashboardOverlay?.classList.contains("active")) {
      if (!profile) {
        closeDashboard();
      } else {
        renderDashboard();
      }
    }
  };

  const openOverlay = () => {
    if (!form) return;
    form.reset();
    clearError();
    updatePreview();
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("profile-open");
    closePanel();
    if (nameInput) nameInput.focus();
  };

  const closeOverlay = () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("profile-open");
    clearError();
    profileButton.focus();
  };

  buildEmojiGrid();
  renderProfile();
  updatePreview();

  profileButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (panel.classList.contains("active")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  document.addEventListener("click", (event) => {
    if (!panel.classList.contains("active")) return;
    if (panel.contains(event.target) || profileButton.contains(event.target)) return;
    closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (dashboardOverlay?.classList.contains("active")) {
      closeDashboard();
      return;
    }

    if (overlay.classList.contains("active")) {
      closeOverlay();
      return;
    }

    if (panel.classList.contains("active")) closePanel();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  dashboardOverlay?.addEventListener("click", (event) => {
    if (event.target === dashboardOverlay) closeDashboard();
  });

  if (loginButton) loginButton.addEventListener("click", openOverlay);

  if (dashboardButton) {
    dashboardButton.addEventListener("click", openDashboard);
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      api.clearProfile();
      closePanel();
    });
  }

  closeButtons.forEach((button) => button.addEventListener("click", closeOverlay));
  dashboardCloseButtons?.forEach((button) => button.addEventListener("click", closeDashboard));

  if (dashboardClearButton) {
    dashboardClearButton.addEventListener("click", clearHistory);
  }

  if (nameInput) nameInput.addEventListener("input", updatePreview);
  if (emojiGrid) emojiGrid.addEventListener("change", updatePreview);

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearError();

      const rawName = nameInput ? nameInput.value.trim() : "";
      const selectedEmoji = getSelectedEmoji();

      if (!rawName) {
        setError("Please enter a user name.");
        return;
      }

      if (!selectedEmoji) {
        setError("Please choose an emoji.");
        return;
      }

      const cleanName = normalizeName(rawName);

      profile = {
        name: cleanName,
        emoji: selectedEmoji,
        mark: 0,
        historyKey: buildHistoryKey(cleanName, selectedEmoji),
      };
      saveProfile(profile);
      renderProfile();
      closeOverlay();
    });
  }

  const api = {
    getProfile: () => (profile ? { ...profile } : null),
    addMark: (points) => {
      if (!profile) return;
      const value = Number(points);
      if (!Number.isFinite(value)) return;
      const nextMark = Math.max(0, Math.floor((profile.mark || 0) + value));
      profile = { ...profile, mark: nextMark };
      saveProfile(profile);
      renderProfile();
    },
    setMark: (value) => {
      if (!profile) return;
      const next = Number(value);
      if (!Number.isFinite(next)) return;
      profile = { ...profile, mark: Math.max(0, Math.floor(next)) };
      saveProfile(profile);
      renderProfile();
    },
    clearProfile: () => {
      profile = null;
      clearProfileStorage();
      closeDashboard(false);
      renderProfile();
    },
    recordHistory,
    getHistory: () => getProfileHistory().slice(),
    clearHistory,
  };

  window.FGHProfile = api;

  window.addEventListener("storage", (event) => {
    if (event.key === PROFILE_STORAGE_KEY) {
      profile = loadProfile();
      renderProfile();
      return;
    }

    if (event.key === HISTORY_STORAGE_KEY && dashboardOverlay?.classList.contains("active")) {
      renderDashboard();
    }
  });
})();
