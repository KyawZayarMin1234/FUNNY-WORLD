(() => {
  const settingsButton = document.querySelector(".nav-settings");
  const overlay = document.getElementById("settings-overlay");
  if (!settingsButton || !overlay) return;

  const closeButton = overlay.querySelector("[data-settings-close]");
  const resetButton = overlay.querySelector("[data-settings-reset]");
  const inputs = Array.from(overlay.querySelectorAll("[data-setting]"));
  const volumeOutput = overlay.querySelector("#volume-output");

  const STORAGE_KEY = "fgh-settings";
  const defaultSettings = {
    theme: "light",
    sound: true,
    music: true,
    volume: 70,
    compact: false,
    showBackground: true,
    saveProgress: true,
    rememberMe: false,
    shareStats: false,
    personalized: false,
    largeText: false,
    reduceMotion: false,
    highContrast: false,
  };

  const sharedScriptUrl = (() => {
    try {
      return new URL(document.currentScript?.src || "shared/settings.js", window.location.href);
    } catch (error) {
      return new URL(window.location.href);
    }
  })();
  const resolveSharedAsset = (relativePath) => new URL(relativePath, sharedScriptUrl).href;

  const musicTrack = new Audio(resolveSharedAsset("../assets/sound/main_sound.mp3"));
  musicTrack.loop = true;
  musicTrack.preload = "auto";
  const isMusicPage = (() => {
    const parts = window.location.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    const lastPart = (parts[parts.length - 1] || "").toLowerCase();
    const page = lastPart && lastPart.includes(".") ? lastPart : "index.html";
    if (page === "index.html") {
      return true;
    }
    const slug = page.replace(/\.html$/, "");
    return ["home", "game", "pixel-game", "story-game", "elon-money"].includes(slug);
  })();
  const PLAYBACK_KEY = "fgh-music-playback";
  let pendingSeekTime = null;
  let autoplayBlocked = false;

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultSettings };
      const parsed = JSON.parse(raw);
      const next = { ...defaultSettings };
      if (parsed && typeof parsed === "object") {
        if (parsed.theme === "light" || parsed.theme === "dark") next.theme = parsed.theme;
        if (typeof parsed.sound === "boolean") next.sound = parsed.sound;
        if (typeof parsed.music === "boolean") next.music = parsed.music;
        if (typeof parsed.volume === "number" && !Number.isNaN(parsed.volume)) {
          next.volume = Math.min(100, Math.max(0, parsed.volume));
        }
        if (typeof parsed.compact === "boolean") next.compact = parsed.compact;
        if (typeof parsed.showBackground === "boolean") next.showBackground = parsed.showBackground;
        if (typeof parsed.saveProgress === "boolean") next.saveProgress = parsed.saveProgress;
        if (typeof parsed.rememberMe === "boolean") next.rememberMe = parsed.rememberMe;
        if (typeof parsed.shareStats === "boolean") next.shareStats = parsed.shareStats;
        if (typeof parsed.personalized === "boolean") next.personalized = parsed.personalized;
        if (typeof parsed.largeText === "boolean") next.largeText = parsed.largeText;
        if (typeof parsed.reduceMotion === "boolean") next.reduceMotion = parsed.reduceMotion;
        if (typeof parsed.highContrast === "boolean") next.highContrast = parsed.highContrast;
      }
      return next;
    } catch (error) {
      return { ...defaultSettings };
    }
  };

  const saveSettings = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Ignore storage errors (private mode or disabled storage).
    }
  };

  let settings = loadSettings();

  const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
  const isGameOpen = () => document.body.classList.contains("game-modal-open");

  const loadPlaybackPosition = () => {
    if (!isMusicPage) return;
    try {
      const raw = sessionStorage.getItem(PLAYBACK_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const time = Number(parsed.time);
      const updated = Number(parsed.updated);
      if (!Number.isFinite(time) || !Number.isFinite(updated)) return;
      const elapsed = (Date.now() - updated) / 1000;
      pendingSeekTime = Math.max(0, time + elapsed);
    } catch (error) {
      // Ignore corrupted playback data.
    }
  };

  const savePlaybackPosition = (force = false) => {
    if (!isMusicPage || !Number.isFinite(musicTrack.currentTime)) return;
    const now = Date.now();
    if (!force && savePlaybackPosition.lastSave && now - savePlaybackPosition.lastSave < 2000) return;
    savePlaybackPosition.lastSave = now;
    try {
      sessionStorage.setItem(
        PLAYBACK_KEY,
        JSON.stringify({ time: musicTrack.currentTime, updated: now })
      );
    } catch (error) {
      // Ignore storage errors.
    }
  };

  loadPlaybackPosition();

  musicTrack.addEventListener("loadedmetadata", () => {
    if (pendingSeekTime === null) return;
    if (!Number.isFinite(musicTrack.duration) || musicTrack.duration <= 0) return;
    const target = pendingSeekTime % musicTrack.duration;
    pendingSeekTime = null;
    try {
      musicTrack.currentTime = target;
    } catch (error) {
      // Ignore seek errors.
    }
  });

  const setMusicVolume = (data) => {
    const volume = clampNumber(
      typeof data.volume === "number" && !Number.isNaN(data.volume)
        ? data.volume
        : defaultSettings.volume,
      0,
      100
    );
    musicTrack.volume = volume / 100;
  };

  const playMusic = () => {
    if (!musicTrack.paused) return;
    const playPromise = musicTrack.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        autoplayBlocked = true;
      });
    }
  };

  const pauseMusic = () => {
    if (!musicTrack.paused) musicTrack.pause();
  };

  const shouldPlayMusic = (data) => data.music && !isGameOpen();

  const syncAudio = (data) => {
    if (!isMusicPage) {
      pauseMusic();
      return;
    }
    setMusicVolume(data);
    if (shouldPlayMusic(data)) {
      playMusic();
    } else {
      pauseMusic();
    }
  };

  const registerInteraction = (event) => {
    if (!isMusicPage) return;
    if (event?.target?.closest?.("[data-open]")) {
      setTimeout(() => syncAudio(settings), 0);
      return;
    }
    syncAudio(settings);
  };

  const applySettings = (data) => {
    document.body.dataset.theme = data.theme;
    document.body.classList.toggle("compact-ui", data.compact);
    document.body.classList.toggle("no-page-bg", !data.showBackground);
    document.body.classList.toggle("large-text", data.largeText);
    document.body.classList.toggle("reduce-motion", data.reduceMotion);
    document.body.classList.toggle("high-contrast", data.highContrast);
    document.body.dataset.sound = data.sound ? "on" : "off";
    document.body.dataset.music = data.music ? "on" : "off";
    syncAudio(data);
  };

  const syncInputs = (data) => {
    inputs.forEach((input) => {
      const key = input.dataset.setting;
      if (!key) return;
      if (input.type === "checkbox") {
        input.checked = Boolean(data[key]);
      } else if (input.type === "radio") {
        input.checked = data[key] === input.value;
      } else if (input.type === "range") {
        input.value = String(data[key]);
      } else if (input.tagName === "SELECT") {
        input.value = data[key];
      }
    });
    if (volumeOutput) volumeOutput.textContent = String(data.volume);
  };

  const updateSettingFromInput = (input, data) => {
    const key = input.dataset.setting;
    if (!key) return;
    if (input.type === "checkbox") {
      data[key] = input.checked;
    } else if (input.type === "radio") {
      if (input.checked) data[key] = input.value;
    } else if (input.type === "range") {
      data[key] = Number(input.value);
    } else if (input.tagName === "SELECT") {
      data[key] = input.value;
    }
  };

  const openSettings = () => {
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    settingsButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("settings-open");
    if (closeButton) closeButton.focus();
  };

  const closeSettings = () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    settingsButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("settings-open");
    settingsButton.focus();
  };

  applySettings(settings);
  syncInputs(settings);

  settingsButton.addEventListener("click", openSettings);
  if (closeButton) closeButton.addEventListener("click", closeSettings);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeSettings();
    }
  });

  inputs.forEach((input) => {
    const eventName = input.type === "range" ? "input" : "change";
    input.addEventListener(eventName, () => {
      updateSettingFromInput(input, settings);
      if (input.type === "range" && volumeOutput) {
        volumeOutput.textContent = String(settings.volume);
      }
      applySettings(settings);
      saveSettings(settings);
    });
  });

  document.addEventListener("pointerdown", registerInteraction);
  document.addEventListener("keydown", registerInteraction);
  window.addEventListener("pagehide", () => savePlaybackPosition(true));
  musicTrack.addEventListener("timeupdate", () => savePlaybackPosition());

  const scheduleSync = () => {
    setTimeout(() => syncAudio(settings), 0);
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-open], [data-close]")) {
      scheduleSync();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      scheduleSync();
    }
  });

  const bodyObserver = new MutationObserver(() => syncAudio(settings));
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      settings = { ...defaultSettings };
      applySettings(settings);
      syncInputs(settings);
      saveSettings(settings);
    });
  }
})();
