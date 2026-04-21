// Game Tab JavaScript
const runnerCanvas = document.getElementById("runner-canvas");
const runnerCtx = runnerCanvas ? runnerCanvas.getContext("2d") : null;
const runnerOverlay = document.getElementById("runner-overlay");
const runnerModal = runnerOverlay ? runnerOverlay.querySelector(".runner-modal") : null;
const runnerHeader = runnerOverlay ? runnerOverlay.querySelector(".runner-header") : null;
const runnerHud = runnerOverlay ? runnerOverlay.querySelector(".runner-hud") : null;
const runnerFooter = runnerOverlay ? runnerOverlay.querySelector(".runner-footer") : null;
const runnerStage = document.getElementById("runner-stage");
const runnerStartBtn = document.getElementById("runner-start");
const runnerResumeBtn = document.getElementById("runner-resume");
const runnerRestartBtn = document.getElementById("runner-restart");
const runnerGameOverRestartBtn = document.getElementById("runner-gameover-restart");
const runnerStartScreen = document.getElementById("runner-start-screen");
const runnerPauseScreen = document.getElementById("runner-pause-screen");
const runnerGameOverScreen = document.getElementById("runner-gameover-screen");
const runnerScoreEl = document.getElementById("runner-score");
const runnerHighEl = document.getElementById("runner-high");
const runnerLevelEl = document.getElementById("runner-level");
const runnerSpeedEl = document.getElementById("runner-speed");
const runnerComboEl = document.getElementById("runner-combo");
const runnerFinalScoreEl = document.getElementById("runner-final-score");
const runnerFinalHighEl = document.getElementById("runner-final-high");
const runnerMusicToggle = document.getElementById("runner-music-toggle");
const runnerMusicStateEl = document.getElementById("runner-music-state");
const runnerDifficultyButtons = document.querySelectorAll("[data-difficulty]");
const runnerControlButtons = document.querySelectorAll(".runner-controls [data-control]");

const catchCanvas = document.getElementById("catch-canvas");
const catchCtx = catchCanvas ? catchCanvas.getContext("2d") : null;
const catchScoreEl = document.getElementById("catch-score");
const catchBestEl = document.getElementById("catch-best");
const catchSpeedEl = document.getElementById("catch-speed");
const catchStreakEl = document.getElementById("catch-streak");
const catchStatusEl = document.getElementById("catch-status");
const catchStartBtn = document.getElementById("catch-start");
const catchOverlay = document.getElementById("catch-overlay");
const openButtons = document.querySelectorAll("[data-open]");
const closeButtons = document.querySelectorAll("[data-close]");

const addProfileMark = (points) => {
  if (window.FGHProfile && typeof window.FGHProfile.addMark === "function") {
    window.FGHProfile.addMark(points);
  }
};

const recordGameHistory = (payload) => {
  if (window.FGHProfile && typeof window.FGHProfile.recordHistory === "function") {
    window.FGHProfile.recordHistory(payload);
  }
};

const formatHistoryLabel = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const isRunnerOpen = () => runnerOverlay && runnerOverlay.classList.contains("active");
const isCatchOpen = () => catchOverlay && catchOverlay.classList.contains("active");

// Simple key state for ball catch
const keys = {
  left: false,
  right: false,
};

const clearKeys = () => {
  keys.left = false;
  keys.right = false;
};

const runnerNumberFormatter = new Intl.NumberFormat("en-US");
const formatRunnerNumber = (value) => runnerNumberFormatter.format(Number(value) || 0);
let runnerSessionActive = false;
let catchSessionActive = false;

const setOverlay = (overlay, isOpen) => {
  if (!overlay) return;
  overlay.classList.toggle("active", isOpen);
  overlay.setAttribute("aria-hidden", String(!isOpen));
};

const openGame = (type) => {
  if (type === "runner") {
    setOverlay(runnerOverlay, true);
    setOverlay(catchOverlay, false);
    stopCatchGame("Ready");
    prepareRunnerGame();
  } else if (type === "catch") {
    setOverlay(catchOverlay, true);
    setOverlay(runnerOverlay, false);
    stopRunnerGame();
    resetCatchGame();
  }
  document.body.classList.add("game-modal-open");
  clearKeys();
};

const closeGame = (type) => {
  if (type === "runner") {
    setOverlay(runnerOverlay, false);
    stopRunnerGame();
  } else if (type === "catch") {
    setOverlay(catchOverlay, false);
    stopCatchGame("Ready");
  }
  if (!isRunnerOpen() && !isCatchOpen()) {
    document.body.classList.remove("game-modal-open");
  }
  clearKeys();
};

openButtons.forEach((button) => {
  button.addEventListener("click", () => openGame(button.dataset.open));
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => closeGame(button.dataset.close));
});

// Runner game configuration
const RUNNER_CONFIG = {
  world: { width: 900, height: 275 },
  groundHeight: 44,
  baseSpeed: 5,
  speedStep: 0.1,
  speedStepPoints: 100,
  gravity: 0.7,
  jumpVelocity: 12.5,
  maxJumps: 2,
  scoreRate: 0.45,
  comboMax: 5,
  scoreToPtero: 300,
};

const DIFFICULTY_PRESETS = {
  easy: { speedMul: 0.9, spawnMul: 1.15 },
  medium: { speedMul: 1, spawnMul: 1 },
  hard: { speedMul: 1.15, spawnMul: 0.85 },
};

const runnerState = {
  active: false,
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  highScore: 0,
  level: 1,
  speed: RUNNER_CONFIG.baseSpeed,
  combo: 1,
  difficulty: "easy",
  obstacles: [],
  particles: [],
  groundOffset: 0,
  spawnTimer: 0,
  uiTimer: 0,
  lastTime: 0,
  animating: false,
  lastMarkScore: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dpr: window.devicePixelRatio || 1,
  duckHeld: false,
  player: {
    x: 136,
    y: 0,
    w: 34,
    h: 42,
    duckH: 26,
    vy: 0,
    grounded: true,
    ducking: false,
    jumpCount: 0,
    legPhase: 0,
  },
};

const runnerAudio = {
  ctx: null,
  master: null,
  musicNodes: null,
  musicOn: false,
};

const runnerHighScoreKey = "fgh-runner-highscore";

const loadRunnerHighScore = () => {
  try {
    const stored = localStorage.getItem(runnerHighScoreKey);
    runnerState.highScore = stored ? Number(stored) || 0 : 0;
  } catch (error) {
    runnerState.highScore = 0;
  }
  if (runnerHighEl) runnerHighEl.textContent = formatRunnerNumber(runnerState.highScore);
};

const saveRunnerHighScore = (score) => {
  if (score <= runnerState.highScore) return;
  runnerState.highScore = score;
  if (runnerHighEl) runnerHighEl.textContent = formatRunnerNumber(runnerState.highScore);
  try {
    localStorage.setItem(runnerHighScoreKey, String(runnerState.highScore));
  } catch (error) {
    // Ignore storage errors.
  }
};

const ensureAudio = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;
  if (!runnerAudio.ctx) {
    runnerAudio.ctx = new AudioContext();
    runnerAudio.master = runnerAudio.ctx.createGain();
    runnerAudio.master.gain.value = 0.2;
    runnerAudio.master.connect(runnerAudio.ctx.destination);
  }
  if (runnerAudio.ctx.state === "suspended") {
    runnerAudio.ctx.resume();
  }
  return true;
};

const allowSound = () => document.body.dataset.sound !== "off";
const allowMusic = () => document.body.dataset.music !== "off";

const playTone = ({ freq, duration, volume = 0.08, type = "sine" }) => {
  if (!allowSound()) return;
  if (!ensureAudio()) return;
  const ctx = runnerAudio.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(runnerAudio.master);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
};

const playJumpSound = () => playTone({ freq: 520, duration: 0.18, volume: 0.07, type: "square" });
const playGameOverSound = () => playTone({ freq: 180, duration: 0.3, volume: 0.09, type: "triangle" });
const playCatchSound = () => playTone({ freq: 640, duration: 0.12, volume: 0.06, type: "sine" });

const updateMusicButton = () => {
  if (!runnerMusicToggle) return;
  const musicOn = runnerAudio.musicOn;
  runnerMusicToggle.dataset.state = musicOn ? "on" : "off";
  runnerMusicToggle.setAttribute("aria-pressed", runnerAudio.musicOn ? "true" : "false");
  runnerMusicToggle.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
  runnerMusicToggle.title = musicOn ? "Turn music off" : "Turn music on";
  if (runnerMusicStateEl) runnerMusicStateEl.textContent = musicOn ? "On" : "Off";
};

const startRunnerMusic = () => {
  if (runnerAudio.musicOn) return;
  if (!allowMusic()) return;
  if (!ensureAudio()) return;
  const ctx = runnerAudio.ctx;
  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  gain.connect(runnerAudio.master);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sine";
  osc2.type = "triangle";
  osc1.frequency.value = 220;
  osc2.frequency.value = 330;
  osc1.connect(gain);
  osc2.connect(gain);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.18;
  lfoGain.gain.value = 6;
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);

  osc1.start();
  osc2.start();
  lfo.start();

  runnerAudio.musicNodes = { gain, osc1, osc2, lfo, lfoGain };
  runnerAudio.musicOn = true;
  updateMusicButton();
};

const stopRunnerMusic = () => {
  if (!runnerAudio.musicNodes) return;
  const nodes = runnerAudio.musicNodes;
  [nodes.osc1, nodes.osc2, nodes.lfo].forEach((node) => {
    try {
      node.stop();
    } catch (error) {
      // Ignore stop errors.
    }
  });
  nodes.gain.disconnect();
  runnerAudio.musicNodes = null;
  runnerAudio.musicOn = false;
  updateMusicButton();
};

const toggleRunnerMusic = () => {
  if (runnerAudio.musicOn) {
    stopRunnerMusic();
  } else {
    startRunnerMusic();
  }
};

const updateRunnerScreens = ({ start = false, pause = false, gameOver = false } = {}) => {
  let screen = "playing";
  if (start) screen = "start";
  if (pause) screen = "pause";
  if (gameOver) screen = "gameover";
  if (runnerOverlay) runnerOverlay.dataset.runnerScreen = screen;
  if (runnerModal) runnerModal.dataset.runnerScreen = screen;

  if (runnerStartScreen) {
    runnerStartScreen.classList.toggle("hidden", !start);
    runnerStartScreen.setAttribute("aria-hidden", String(!start));
  }
  if (runnerPauseScreen) {
    runnerPauseScreen.classList.toggle("hidden", !pause);
    runnerPauseScreen.setAttribute("aria-hidden", String(!pause));
  }
  if (runnerGameOverScreen) {
    runnerGameOverScreen.classList.toggle("hidden", !gameOver);
    runnerGameOverScreen.setAttribute("aria-hidden", String(!gameOver));
  }

  resizeRunnerCanvas();
};

const resizeRunnerCanvas = () => {
  if (!runnerCanvas || !runnerStage || !runnerOverlay) return;

  const stageRatio = RUNNER_CONFIG.world.height / RUNNER_CONFIG.world.width;
  const viewportWidth = runnerOverlay.clientWidth || window.innerWidth || RUNNER_CONFIG.world.width;
  const maxStageWidth = Math.min(1720, viewportWidth);
  const modalStyle = runnerModal ? window.getComputedStyle(runnerModal) : null;
  const modalPaddingX = modalStyle
    ? (parseFloat(modalStyle.paddingLeft) || 0) + (parseFloat(modalStyle.paddingRight) || 0)
    : 0;
  const modalPaddingY = modalStyle
    ? (parseFloat(modalStyle.paddingTop) || 0) + (parseFloat(modalStyle.paddingBottom) || 0)
    : 0;
  const modalGap = modalStyle
    ? parseFloat(modalStyle.rowGap || modalStyle.gap || 0) || 0
    : 0;
  const chromeHeight =
    (runnerHeader ? runnerHeader.offsetHeight : 0)
    + (runnerHud ? runnerHud.offsetHeight : 0)
    + (runnerFooter ? runnerFooter.offsetHeight : 0)
    + modalPaddingY
    + modalGap
    + 4;
  const availableWidth = Math.max(220, maxStageWidth - modalPaddingX - 4);
  const availableHeight = Math.max(190, window.innerHeight - chromeHeight);
  const isNarrowPortrait = availableWidth <= 520 && window.innerHeight > window.innerWidth;

  let width = availableWidth;
  let height;

  if (isNarrowPortrait) {
    height = Math.round(width * stageRatio);
    if (height > availableHeight) {
      height = availableHeight;
      width = Math.round(height / stageRatio);
    }
  } else {
    height = Math.round(width * stageRatio);
    if (height > availableHeight) {
      height = availableHeight;
      width = Math.round(height / stageRatio);
    }
  }

  runnerStage.style.width = `${width}px`;
  runnerStage.style.height = `${height}px`;
  runnerCanvas.style.width = `${width}px`;
  runnerCanvas.style.height = `${height}px`;
  runnerState.dpr = window.devicePixelRatio || 1;
  runnerCanvas.width = Math.round(width * runnerState.dpr);
  runnerCanvas.height = Math.round(height * runnerState.dpr);
  runnerState.scale = Math.min(width / RUNNER_CONFIG.world.width, height / RUNNER_CONFIG.world.height);
  runnerState.offsetX = Math.round((width - RUNNER_CONFIG.world.width * runnerState.scale) * 0.5);
  runnerState.offsetY = Math.round(height - RUNNER_CONFIG.world.height * runnerState.scale);
};

const resetRunnerPlayer = () => {
  const groundY = RUNNER_CONFIG.world.height - RUNNER_CONFIG.groundHeight;
  runnerState.player.w = 34;
  runnerState.player.h = 42;
  runnerState.player.y = groundY - runnerState.player.h;
  runnerState.player.vy = 0;
  runnerState.player.grounded = true;
  runnerState.player.jumpCount = 0;
  runnerState.player.ducking = false;
  runnerState.duckHeld = false;
  runnerState.player.legPhase = 0;
};

const resetRunnerState = () => {
  runnerState.score = 0;
  runnerState.speed = RUNNER_CONFIG.baseSpeed;
  runnerState.level = 1;
  runnerState.combo = 1;
  runnerState.obstacles = [];
  runnerState.particles = [];
  runnerState.spawnTimer = 0.8;
  runnerState.groundOffset = 0;
  runnerState.lastMarkScore = 0;
  resetRunnerPlayer();
  updateRunnerUI(true);
};

const prepareRunnerGame = () => {
  runnerState.active = true;
  runnerState.running = false;
  runnerState.paused = false;
  runnerState.gameOver = false;
  loadRunnerHighScore();
  updateRunnerScreens({ start: true, pause: false, gameOver: false });
  resizeRunnerCanvas();
  resetRunnerState();
  startRunnerLoop();
};

const startRunnerGame = () => {
  if (!runnerState.active) return;
  runnerState.running = true;
  runnerState.paused = false;
  runnerState.gameOver = false;
  updateRunnerScreens({ start: false, pause: false, gameOver: false });
  resetRunnerState();
  runnerSessionActive = true;
  recordGameHistory({
    game: "Endless Runner",
    action: "Started",
    details: `Difficulty: ${formatHistoryLabel(runnerState.difficulty) || "Easy"}`,
  });
};

const stopRunnerGame = () => {
  if (runnerSessionActive) {
    recordGameHistory({
      game: "Endless Runner",
      action: "Exited",
      details: `Score: ${formatRunnerNumber(Math.floor(runnerState.score))} | Difficulty: ${formatHistoryLabel(runnerState.difficulty) || "Easy"}`,
    });
    runnerSessionActive = false;
  }
  runnerState.running = false;
  runnerState.paused = false;
  runnerState.gameOver = false;
  runnerState.active = false;
  runnerState.animating = false;
  stopRunnerMusic();
  updateRunnerScreens({ start: true, pause: false, gameOver: false });
};

const toggleRunnerPause = () => {
  if (!runnerState.running || runnerState.gameOver) return;
  runnerState.paused = !runnerState.paused;
  updateRunnerScreens({ start: false, pause: runnerState.paused, gameOver: false });
};

const resumeRunnerGame = () => {
  if (!runnerState.running) return;
  runnerState.paused = false;
  updateRunnerScreens({ start: false, pause: false, gameOver: false });
};

const runnerJump = () => {
  if (!runnerState.active) return;
  if (!runnerState.running) {
    startRunnerGame();
  }
  if (runnerState.paused || runnerState.gameOver) return;
  const player = runnerState.player;
  if (player.jumpCount >= RUNNER_CONFIG.maxJumps) return;

  player.vy = -RUNNER_CONFIG.jumpVelocity;
  player.grounded = false;
  player.jumpCount += 1;

  if (player.jumpCount > 1) {
    runnerState.combo = Math.min(RUNNER_CONFIG.comboMax, runnerState.combo + 1);
  }

  spawnJumpParticles();
  playJumpSound();
};

const runnerSetDuck = (isDuck) => {
  runnerState.duckHeld = isDuck;
  runnerState.player.ducking = isDuck && runnerState.player.grounded;
};

const spawnJumpParticles = () => {
  const player = runnerState.player;
  const groundY = RUNNER_CONFIG.world.height - RUNNER_CONFIG.groundHeight;
  for (let i = 0; i < 6; i += 1) {
    runnerState.particles.push({
      x: player.x + player.w * 0.4 + Math.random() * 6,
      y: groundY - 4,
      vx: -1 + Math.random() * 2,
      vy: -2 - Math.random() * 2,
      life: 0.6 + Math.random() * 0.3,
      size: 2 + Math.random() * 2,
    });
  }
};

const getRunnerLevel = (score) => {
  if (score >= 1000) return 3;
  if (score >= 500) return 2;
  return 1;
};

const updateRunnerSpeed = (score) => {
  const baseSpeed = RUNNER_CONFIG.baseSpeed + Math.floor(score / RUNNER_CONFIG.speedStepPoints) * RUNNER_CONFIG.speedStep;
  const difficulty = DIFFICULTY_PRESETS[runnerState.difficulty] || DIFFICULTY_PRESETS.easy;
  let speed = baseSpeed * difficulty.speedMul;
  runnerState.level = getRunnerLevel(score);
  if (runnerState.level === 2) speed *= 1.2;
  if (runnerState.level === 3) speed *= 1.4;
  runnerState.speed = speed;
};

const spawnRunnerObstacle = () => {
  const scoreValue = Math.floor(runnerState.score);
  const canSpawnPtero = scoreValue >= RUNNER_CONFIG.scoreToPtero;
  const level = runnerState.level;
  const pteroChance = canSpawnPtero ? (level === 3 ? 0.55 : 0.28) : 0;
  const type = Math.random() < pteroChance ? "ptero" : "cactus";
  const groundY = RUNNER_CONFIG.world.height - RUNNER_CONFIG.groundHeight;

  if (type === "ptero") {
    const heightOptions = [60, 80, 100];
    const height = heightOptions[Math.floor(Math.random() * heightOptions.length)];
    runnerState.obstacles.push({
      type,
      x: RUNNER_CONFIG.world.width + 60,
      y: groundY - height,
      w: 46,
      h: 22,
      color: "#8a5a44",
      passed: false,
    });
  } else {
    const w = 22 + Math.random() * 14;
    const h = 32 + Math.random() * 26;
    runnerState.obstacles.push({
      type,
      x: RUNNER_CONFIG.world.width + 40,
      y: groundY - h,
      w,
      h,
      color: "#2ea44f",
      passed: false,
    });
  }
};

const updateRunnerUI = (force = false) => {
  if (!runnerScoreEl || !runnerLevelEl || !runnerSpeedEl || !runnerComboEl) return;
  if (!force && runnerState.uiTimer < 0.08) return;

  const scoreValue = Math.floor(runnerState.score);
  runnerScoreEl.textContent = formatRunnerNumber(scoreValue);
  runnerLevelEl.textContent = String(runnerState.level);
  runnerSpeedEl.textContent = runnerState.speed.toFixed(1);
  runnerComboEl.textContent = `x${runnerState.combo}`;
  if (runnerHighEl) runnerHighEl.textContent = formatRunnerNumber(runnerState.highScore);
  runnerState.uiTimer = 0;
};

const runnerCollision = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const updateRunner = (delta) => {
  const frameScale = delta * 60;
  runnerState.uiTimer += delta;

  runnerState.score += RUNNER_CONFIG.scoreRate * frameScale * runnerState.combo;
  const scoreValue = Math.floor(runnerState.score);
  updateRunnerSpeed(scoreValue);

  if (scoreValue - runnerState.lastMarkScore >= 200) {
    addProfileMark(1);
    runnerState.lastMarkScore = scoreValue;
  }

  runnerState.groundOffset = (runnerState.groundOffset + runnerState.speed * frameScale) % 48;

  // Update player physics
  const player = runnerState.player;
  if (!player.grounded) {
    player.vy += RUNNER_CONFIG.gravity * frameScale;
    player.y += player.vy * frameScale;
  }

  const groundY = RUNNER_CONFIG.world.height - RUNNER_CONFIG.groundHeight;
  if (player.grounded) {
    player.ducking = runnerState.duckHeld;
    player.h = player.ducking ? player.duckH : 42;
    player.y = groundY - player.h;
  } else {
    player.h = 42;
  }

  if (player.y >= groundY - player.h) {
    player.y = groundY - player.h;
    if (!player.grounded) {
      player.grounded = true;
      player.jumpCount = 0;
      runnerState.combo = 1;
    }
    player.vy = 0;
  }

  if (player.grounded && !player.ducking) {
    player.legPhase += frameScale * 0.25;
  }

  // Spawn obstacles
  const difficulty = DIFFICULTY_PRESETS[runnerState.difficulty] || DIFFICULTY_PRESETS.easy;
  const speedFactor = runnerState.speed / RUNNER_CONFIG.baseSpeed;
  const levelFactor = runnerState.level === 1 ? 1 : runnerState.level === 2 ? 0.85 : 0.7;
  runnerState.spawnTimer -= delta;
  if (runnerState.spawnTimer <= 0) {
    spawnRunnerObstacle();
    const min = 0.85;
    const max = 1.4;
    const interval =
      ((min + Math.random() * (max - min)) * levelFactor * difficulty.spawnMul) / Math.max(0.6, speedFactor);
    runnerState.spawnTimer = Math.max(0.35, interval);
  }

  // Update obstacles
  runnerState.obstacles.forEach((obstacle) => {
    obstacle.x -= runnerState.speed * frameScale;
  });

  runnerState.obstacles = runnerState.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -40);

  const playerBox = {
    x: player.x + 4,
    y: player.y + 4,
    w: player.w - 8,
    h: player.h - 6,
  };

  for (const obstacle of runnerState.obstacles) {
    const obstacleBox = {
      x: obstacle.x + 2,
      y: obstacle.y + 2,
      w: obstacle.w - 4,
      h: obstacle.h - 4,
    };
    if (runnerCollision(playerBox, obstacleBox)) {
      endRunnerGame();
      break;
    }
    if (!obstacle.passed && obstacle.x + obstacle.w < player.x) {
      obstacle.passed = true;
    }
  }

  // Update particles
  runnerState.particles.forEach((particle) => {
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.vy += 0.25 * frameScale;
    particle.life -= delta;
  });
  runnerState.particles = runnerState.particles.filter((particle) => particle.life > 0);

  updateRunnerUI();
};

const drawRunnerSkyline = (ctx, baseY, depth, buildingColor, windowColor) => {
  const slot = 70 + depth * 14;
  const scroll = (runnerState.groundOffset * (0.16 + depth * 0.06)) % slot;
  const blur = depth === 0 ? 10 : depth === 1 ? 4 : 0;
  ctx.save();
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = buildingColor;

  for (let i = -2; i < 15; i += 1) {
    const x = i * slot - scroll;
    const width = 34 + ((i * 17 + depth * 13) % 46);
    const height = 44 + ((i * 23 + depth * 19) % 120);
    ctx.fillRect(x, baseY - height, width, height);
    if ((i + depth) % 3 === 0) {
      ctx.fillRect(x + width * 0.3, baseY - height - 18, width * 0.24, 18);
    }
  }

  if (blur) ctx.filter = "none";
  ctx.fillStyle = windowColor;
  for (let i = -2; i < 15; i += 1) {
    const x = i * slot - scroll;
    const width = 34 + ((i * 17 + depth * 13) % 46);
    const height = 44 + ((i * 23 + depth * 19) % 120);
    if (depth === 0) continue;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        if ((row + col + i + depth) % 2 === 0) continue;
        ctx.fillRect(x + 10 + col * 13, baseY - height + 18 + row * 18, 4, 8);
      }
    }
  }
  ctx.restore();
};

const drawRunnerBackground = (ctx, isNight) => {
  const height = RUNNER_CONFIG.world.height;
  const groundY = height - RUNNER_CONFIG.groundHeight;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, isNight ? "#061135" : "#092162");
  gradient.addColorStop(0.55, isNight ? "#10327a" : "#17479a");
  gradient.addColorStop(1, isNight ? "#0b1d59" : "#123a83");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, RUNNER_CONFIG.world.width, height);

  const glow = ctx.createRadialGradient(
    RUNNER_CONFIG.world.width * 0.5,
    height * 0.55,
    22,
    RUNNER_CONFIG.world.width * 0.5,
    height * 0.55,
    360
  );
  glow.addColorStop(0, "rgba(100, 170, 255, 0.18)");
  glow.addColorStop(1, "rgba(100, 170, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, RUNNER_CONFIG.world.width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.46)";
  for (let i = 0; i < 14; i += 1) {
    const x = (i * 83 + Math.floor(runnerState.score * 0.35)) % RUNNER_CONFIG.world.width;
    const y = 28 + ((i * 29) % Math.max(40, groundY - 140));
    ctx.fillRect(x, y, 2, 2);
  }

  drawRunnerSkyline(ctx, groundY - 18, 0, "rgba(9, 18, 57, 0.42)", "rgba(95, 144, 255, 0.08)");
  drawRunnerSkyline(ctx, groundY - 12, 1, "rgba(13, 28, 84, 0.56)", "rgba(101, 152, 255, 0.14)");
  drawRunnerSkyline(ctx, groundY - 4, 2, "rgba(21, 49, 125, 0.78)", "rgba(114, 172, 255, 0.2)");
};

const drawRunnerGround = (ctx) => {
  const height = RUNNER_CONFIG.world.height;
  const groundY = height - RUNNER_CONFIG.groundHeight;
  const platformGradient = ctx.createLinearGradient(0, groundY, 0, height);
  platformGradient.addColorStop(0, "#12275f");
  platformGradient.addColorStop(0.28, "#09153b");
  platformGradient.addColorStop(1, "#040812");
  ctx.fillStyle = platformGradient;
  ctx.fillRect(0, groundY, RUNNER_CONFIG.world.width, height - groundY);

  ctx.fillStyle = "#0b1333";
  ctx.fillRect(0, groundY + 12, RUNNER_CONFIG.world.width, 10);
  ctx.fillStyle = "#081028";
  ctx.fillRect(0, groundY + 24, RUNNER_CONFIG.world.width, 9);
  ctx.fillStyle = "#060b18";
  ctx.fillRect(0, groundY + 33, RUNNER_CONFIG.world.width, height - groundY - 33);

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(85, 199, 255, 0.85)";
  ctx.fillStyle = "rgba(85, 199, 255, 0.92)";
  ctx.fillRect(0, groundY + 8, RUNNER_CONFIG.world.width, 3);
  ctx.restore();

  const tileOffset = runnerState.groundOffset % 60;
  for (let x = -tileOffset; x < RUNNER_CONFIG.world.width + 60; x += 60) {
    const light = ctx.createLinearGradient(x, 0, x + 34, 0);
    light.addColorStop(0, "rgba(85, 140, 255, 0.35)");
    light.addColorStop(0.5, "rgba(114, 224, 255, 1)");
    light.addColorStop(1, "rgba(85, 140, 255, 0.35)");
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(114, 224, 255, 0.72)";
    ctx.fillStyle = light;
    ctx.fillRect(x + 10, groundY + 21, 34, 4);
    ctx.restore();
  }
};

const drawRunnerPlayer = (ctx) => {
  const player = runnerState.player;
  const legOffset = Math.floor(player.legPhase) % 2 === 0 ? 0 : 5;
  const bodyGradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
  bodyGradient.addColorStop(0, "#142f83");
  bodyGradient.addColorStop(0.45, "#101e56");
  bodyGradient.addColorStop(1, "#08102e");

  ctx.save();
  ctx.fillStyle = "rgba(10, 18, 50, 0.7)";
  ctx.fillRect(player.x + 4, player.y + player.h + 2, player.w - 8, 4);
  ctx.restore();

  ctx.fillStyle = bodyGradient;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = "rgba(122, 181, 255, 0.28)";
  ctx.lineWidth = 1.25;
  ctx.strokeRect(player.x + 0.6, player.y + 0.6, player.w - 1.2, player.h - 1.2);

  ctx.fillStyle = "#f6fbff";
  ctx.fillRect(player.x + player.w - 8, player.y + 9, 4, 4);

  if (!player.grounded || player.ducking) return;

  ctx.fillStyle = "#08102a";
  ctx.fillRect(player.x + 5, player.y + player.h - 4, 6, 5 + legOffset * 0.35);
  ctx.fillRect(player.x + player.w - 11, player.y + player.h - 4, 6, 5 + (5 - legOffset) * 0.35);
};

const drawRunnerObstacle = (ctx, obstacle) => {
  if (obstacle.type === "ptero") {
    ctx.save();
    ctx.fillStyle = "#ed6c4d";
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.h * 0.75);
    ctx.lineTo(obstacle.x + obstacle.w * 0.46, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h * 0.75);
    ctx.lineTo(obstacle.x + obstacle.w * 0.58, obstacle.y + obstacle.h * 0.46);
    ctx.lineTo(obstacle.x + obstacle.w * 0.42, obstacle.y + obstacle.h * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5d2738";
    ctx.fillRect(obstacle.x + obstacle.w * 0.32, obstacle.y + obstacle.h * 0.48, obstacle.w * 0.36, 5);
    ctx.restore();
    return;
  }

  const bodyGradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.h);
  bodyGradient.addColorStop(0, "#c15d4f");
  bodyGradient.addColorStop(1, "#6d2536");
  ctx.fillStyle = bodyGradient;
  ctx.fillRect(obstacle.x, obstacle.y + 12, obstacle.w, obstacle.h - 12);

  const crownCount = Math.max(2, Math.round(obstacle.w / 12));
  for (let i = 0; i < crownCount; i += 1) {
    const sx = obstacle.x + (i * obstacle.w) / crownCount;
    const sw = obstacle.w / crownCount;
    ctx.beginPath();
    ctx.moveTo(sx, obstacle.y + 12);
    ctx.lineTo(sx + sw * 0.5, obstacle.y);
    ctx.lineTo(sx + sw, obstacle.y + 12);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 219, 206, 0.34)";
  ctx.fillRect(obstacle.x + 5, obstacle.y + 16, obstacle.w - 10, 3);
};

const drawRunnerParticles = (ctx) => {
  runnerState.particles.forEach((particle) => {
    const alpha = Math.max(0.18, particle.life);
    ctx.fillStyle = `rgba(108, 214, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawRunner = () => {
  if (!runnerCtx) return;
  runnerCtx.setTransform(1, 0, 0, 1, 0, 0);
  runnerCtx.clearRect(0, 0, runnerCanvas.width, runnerCanvas.height);
  const shellGradient = runnerCtx.createLinearGradient(0, 0, 0, runnerCanvas.height);
  shellGradient.addColorStop(0, "#081544");
  shellGradient.addColorStop(1, "#071334");
  runnerCtx.fillStyle = shellGradient;
  runnerCtx.fillRect(0, 0, runnerCanvas.width, runnerCanvas.height);
  runnerCtx.setTransform(
    runnerState.dpr * runnerState.scale,
    0,
    0,
    runnerState.dpr * runnerState.scale,
    runnerState.dpr * runnerState.offsetX,
    runnerState.dpr * runnerState.offsetY
  );
  const scoreValue = Math.floor(runnerState.score);
  const isNight = Math.floor(scoreValue / 500) % 2 === 1;

  drawRunnerBackground(runnerCtx, isNight);
  drawRunnerGround(runnerCtx);

  runnerState.obstacles.forEach((obstacle) => drawRunnerObstacle(runnerCtx, obstacle));
  drawRunnerParticles(runnerCtx);
  drawRunnerPlayer(runnerCtx);
};

const endRunnerGame = () => {
  if (!runnerState.running) return;
  runnerState.running = false;
  runnerState.gameOver = true;
  runnerState.paused = false;

  const scoreValue = Math.floor(runnerState.score);
  saveRunnerHighScore(scoreValue);
  if (runnerFinalScoreEl) runnerFinalScoreEl.textContent = formatRunnerNumber(scoreValue);
  if (runnerFinalHighEl) runnerFinalHighEl.textContent = formatRunnerNumber(runnerState.highScore);
  if (runnerSessionActive) {
    recordGameHistory({
      game: "Endless Runner",
      action: "Game Over",
      details: `Score: ${formatRunnerNumber(scoreValue)} | High Score: ${formatRunnerNumber(runnerState.highScore)} | Difficulty: ${formatHistoryLabel(runnerState.difficulty) || "Easy"}`,
    });
    runnerSessionActive = false;
  }
  updateRunnerScreens({ start: false, pause: false, gameOver: true });
  playGameOverSound();
};

const startRunnerLoop = () => {
  if (runnerState.animating) return;
  runnerState.animating = true;
  runnerState.lastTime = performance.now();
  const loop = (time) => {
    if (!runnerState.animating) return;
    const delta = Math.min(0.05, (time - runnerState.lastTime) / 1000);
    runnerState.lastTime = time;
    if (runnerState.running && !runnerState.paused) {
      updateRunner(delta);
    }
    drawRunner();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

// Runner UI events
if (runnerStartBtn) runnerStartBtn.addEventListener("click", startRunnerGame);
if (runnerRestartBtn) runnerRestartBtn.addEventListener("click", startRunnerGame);
if (runnerResumeBtn) runnerResumeBtn.addEventListener("click", resumeRunnerGame);
if (runnerGameOverRestartBtn) runnerGameOverRestartBtn.addEventListener("click", startRunnerGame);
if (runnerMusicToggle) runnerMusicToggle.addEventListener("click", toggleRunnerMusic);

runnerDifficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    runnerDifficultyButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    runnerState.difficulty = button.dataset.difficulty || "easy";
  });
});

runnerControlButtons.forEach((button) => {
  const control = button.dataset.control;
  if (control === "jump") {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      runnerJump();
    });
  }
  if (control === "duck") {
    const stopDuck = () => runnerSetDuck(false);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      runnerSetDuck(true);
    });
    button.addEventListener("pointerup", stopDuck);
    button.addEventListener("pointerleave", stopDuck);
    button.addEventListener("pointercancel", stopDuck);
  }
  if (control === "pause") {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      toggleRunnerPause();
    });
  }
});

window.addEventListener("resize", resizeRunnerCanvas);

// Keyboard controls
document.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (isRunnerOpen()) closeGame("runner");
    if (isCatchOpen()) closeGame("catch");
  }

  if (isCatchOpen()) {
    if (event.code === "ArrowLeft") keys.left = true;
    if (event.code === "ArrowRight") keys.right = true;
  }

  if (isRunnerOpen()) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      if (!event.repeat) runnerJump();
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      runnerSetDuck(true);
    }
    if (event.code === "KeyP") {
      event.preventDefault();
      if (!event.repeat) toggleRunnerPause();
    }
  }
});

document.addEventListener("keyup", (event) => {
  if (isCatchOpen()) {
    if (event.code === "ArrowLeft") keys.left = false;
    if (event.code === "ArrowRight") keys.right = false;
  }

  if (isRunnerOpen() && event.code === "ArrowDown") {
    runnerSetDuck(false);
  }
});

// Ball Catch Game State
const catchBestKey = "fgh-catch-best";
const catchState = {
  running: false,
  score: 0,
  best: 0,
  streak: 0,
  speed: 2.5,
  groundOffset: 0,
  groundY: 0,
  lastTime: 0,
  pointerActive: false,
  pointerX: 0,
  particles: [],
  stars: [],
  streaks: [],
  paddle: { x: 200, y: 0, w: 88, h: 12, vx: 0 },
  ball: { x: 240, y: 30, r: 10 },
};

const setCatchStatus = (text, state = String(text || "ready").toLowerCase().replace(/\s+/g, "-")) => {
  if (!catchStatusEl) return;
  catchStatusEl.textContent = text;
  catchStatusEl.dataset.state = state;
};

const seedCatchBackground = () => {
  if (!catchCanvas) return;
  catchState.stars = Array.from({ length: 34 }, () => ({
    x: Math.random() * catchCanvas.width,
    y: 50 + Math.random() * (catchCanvas.height * 0.62),
    size: 0.8 + Math.random() * 2.2,
    alpha: 0.2 + Math.random() * 0.6,
  }));
  catchState.streaks = Array.from({ length: 12 }, () => ({
    x: 40 + Math.random() * (catchCanvas.width - 80),
    y: 60 + Math.random() * (catchCanvas.height * 0.52),
    width: 34 + Math.random() * 72,
    alpha: 0.08 + Math.random() * 0.14,
  }));
};

const syncCatchGeometry = (resetPositions = false) => {
  if (!catchCanvas) return;
  catchState.groundY = catchCanvas.height - Math.max(72, catchCanvas.height * 0.12);
  catchState.paddle.w = catchCanvas.width * 0.22;
  catchState.paddle.h = Math.max(14, catchCanvas.height * 0.028);
  catchState.paddle.y = catchState.groundY - catchState.paddle.h - Math.max(10, catchCanvas.height * 0.02);
  catchState.ball.r = Math.max(18, catchCanvas.width * 0.018);

  if (resetPositions) {
    catchState.paddle.x = catchCanvas.width / 2 - catchState.paddle.w / 2;
    catchState.ball.x = 70 + Math.random() * (catchCanvas.width - 140);
    catchState.ball.y = catchState.ball.r + 18;
  } else {
    catchState.paddle.x = Math.max(0, Math.min(catchCanvas.width - catchState.paddle.w, catchState.paddle.x));
  }
};

const drawCatchRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const loadCatchBest = () => {
  try {
    const stored = localStorage.getItem(catchBestKey);
    catchState.best = stored ? Number(stored) || 0 : 0;
  } catch (error) {
    catchState.best = 0;
  }
  if (catchBestEl) catchBestEl.textContent = String(catchState.best);
};

const saveCatchBest = () => {
  if (catchState.score <= catchState.best) return;
  catchState.best = catchState.score;
  if (catchBestEl) catchBestEl.textContent = String(catchState.best);
  try {
    localStorage.setItem(catchBestKey, String(catchState.best));
  } catch (error) {
    // Ignore storage errors.
  }
};

const updateCatchHud = () => {
  if (catchScoreEl) catchScoreEl.textContent = String(catchState.score);
  if (catchSpeedEl) catchSpeedEl.textContent = catchState.speed.toFixed(1);
  if (catchStreakEl) catchStreakEl.textContent = String(catchState.streak);
  if (catchBestEl) catchBestEl.textContent = String(catchState.best);
};

const resetCatchGame = () => {
  if (!catchCanvas) return;
  if (catchSessionActive && catchState.running) {
    recordGameHistory({
      game: "Ball Catch Game",
      action: "Restarted",
      details: `Previous score: ${catchState.score}`,
    });
  }
  const wasRunning = catchState.running;
  catchState.running = true;
  catchState.score = 0;
  catchState.streak = 0;
  catchState.speed = 2.5;
  catchState.groundOffset = 0;
  catchState.lastTime = 0;
  catchState.pointerActive = false;
  catchState.particles = [];
  catchState.paddle.vx = 0;
  seedCatchBackground();
  syncCatchGeometry(true);
  setCatchStatus("Running", "running");
  loadCatchBest();
  updateCatchHud();
  drawCatchScene();
  catchSessionActive = true;
  recordGameHistory({
    game: "Ball Catch Game",
    action: "Started",
    details: `Start speed: ${catchState.speed.toFixed(1)}`,
  });
  if (!wasRunning) requestAnimationFrame(updateCatchGame);
};

const stopCatchGame = (statusText) => {
  const wasActiveSession = catchSessionActive;
  const scoreValue = catchState.score;
  catchState.running = false;
  if (statusText) {
    const state = statusText === "Game Over" ? "game-over" : "ready";
    setCatchStatus(statusText, state);
  }
  catchState.pointerActive = false;
  saveCatchBest();
  drawCatchScene();
  if (statusText === "Ready" && wasActiveSession) {
    recordGameHistory({
      game: "Ball Catch Game",
      action: "Exited",
      details: `Score: ${scoreValue} | Best: ${catchState.best}`,
    });
    catchSessionActive = false;
  }
};

const spawnCatchParticles = (x, y, color) => {
  for (let i = 0; i < 12; i += 1) {
    catchState.particles.push({
      x,
      y,
      vx: -1.5 + Math.random() * 3,
      vy: -2 - Math.random() * 2,
      life: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 2,
      color,
    });
  }
};

const drawCatchBackground = (ctx, width, height) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0a2daf");
  gradient.addColorStop(0.55, "#17228b");
  gradient.addColorStop(1, "#5720a3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const lowerGlow = ctx.createRadialGradient(width / 2, height - 40, 10, width / 2, height - 40, width * 0.55);
  lowerGlow.addColorStop(0, "rgba(255, 77, 216, 0.36)");
  lowerGlow.addColorStop(0.5, "rgba(182, 62, 255, 0.18)");
  lowerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = lowerGlow;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  catchState.stars.forEach((star) => {
    ctx.fillStyle = `rgba(154, 180, 255, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  catchState.streaks.forEach((streak) => {
    const streakGradient = ctx.createLinearGradient(streak.x, streak.y, streak.x + streak.width, streak.y);
    streakGradient.addColorStop(0, "rgba(120, 172, 255, 0)");
    streakGradient.addColorStop(0.5, `rgba(120, 172, 255, ${streak.alpha})`);
    streakGradient.addColorStop(1, "rgba(120, 172, 255, 0)");
    ctx.fillStyle = streakGradient;
    ctx.fillRect(streak.x, streak.y, streak.width, 2);
  });

  const groundY = catchState.groundY;
  ctx.strokeStyle = "rgba(231, 132, 255, 0.84)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  const dashGlow = ctx.createLinearGradient(0, groundY + 18, width, groundY + 18);
  dashGlow.addColorStop(0, "rgba(104, 149, 255, 0.9)");
  dashGlow.addColorStop(0.5, "rgba(176, 99, 255, 0.96)");
  dashGlow.addColorStop(1, "rgba(104, 149, 255, 0.9)");
  ctx.fillStyle = dashGlow;
  const dashW = 62;
  const gap = 48;
  const offset = catchState.groundOffset % (dashW + gap);
  for (let x = -offset; x < width; x += dashW + gap) {
    drawCatchRoundedRect(ctx, x, groundY + 16, dashW, 5, 999);
    ctx.fill();
  }
};

const drawCatchPaddle = (ctx) => {
  const paddleY = catchState.paddle.y;
  const glow = ctx.createLinearGradient(0, paddleY, 0, paddleY + catchState.paddle.h);
  glow.addColorStop(0, "#fff17a");
  glow.addColorStop(0.45, "#ffb128");
  glow.addColorStop(1, "#ff8a1e");

  ctx.save();
  ctx.shadowColor = "rgba(255, 170, 46, 0.75)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = glow;
  drawCatchRoundedRect(ctx, catchState.paddle.x, paddleY, catchState.paddle.w, catchState.paddle.h, catchState.paddle.h / 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255, 249, 191, 0.45)";
  drawCatchRoundedRect(
    ctx,
    catchState.paddle.x + 14,
    paddleY + 4,
    catchState.paddle.w - 28,
    Math.max(3, catchState.paddle.h * 0.22),
    999
  );
  ctx.fill();

  ctx.fillStyle = "rgba(255, 122, 28, 0.2)";
  drawCatchRoundedRect(
    ctx,
    catchState.paddle.x + 26,
    catchState.groundY + 8,
    catchState.paddle.w - 52,
    Math.max(8, catchState.paddle.h * 0.7),
    999
  );
  ctx.fill();
};

const drawCatchBall = (ctx) => {
  ctx.save();
  const beamHeight = Math.max(110, catchCanvas.height * 0.18);
  const beamGradient = ctx.createLinearGradient(0, catchState.ball.y - beamHeight, 0, catchState.ball.y + 6);
  beamGradient.addColorStop(0, "rgba(255, 170, 55, 0)");
  beamGradient.addColorStop(0.55, "rgba(255, 145, 42, 0.22)");
  beamGradient.addColorStop(1, "rgba(255, 145, 42, 0)");
  ctx.fillStyle = beamGradient;
  drawCatchRoundedRect(
    ctx,
    catchState.ball.x - catchState.ball.r * 0.8,
    catchState.ball.y - beamHeight,
    catchState.ball.r * 1.6,
    beamHeight,
    catchState.ball.r
  );
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createRadialGradient(
    catchState.ball.x - catchState.ball.r * 0.25,
    catchState.ball.y - catchState.ball.r * 0.25,
    3,
    catchState.ball.x,
    catchState.ball.y,
    catchState.ball.r + 6
  );
  gradient.addColorStop(0, "#fff7b8");
  gradient.addColorStop(0.48, "#ffd33a");
  gradient.addColorStop(1, "#ff8b1d");
  ctx.save();
  ctx.shadowColor = "rgba(255, 153, 38, 0.82)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(catchState.ball.x, catchState.ball.y, catchState.ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.arc(
    catchState.ball.x - catchState.ball.r * 0.28,
    catchState.ball.y - catchState.ball.r * 0.32,
    catchState.ball.r * 0.28,
    0,
    Math.PI * 2
  );
  ctx.fill();
};

const drawCatchScene = () => {
  if (!catchCtx || !catchCanvas) return;
  catchCtx.clearRect(0, 0, catchCanvas.width, catchCanvas.height);
  drawCatchBackground(catchCtx, catchCanvas.width, catchCanvas.height);

  // Particles
  catchState.particles.forEach((particle) => {
    catchCtx.fillStyle = particle.color;
    catchCtx.beginPath();
    catchCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    catchCtx.fill();
  });

  drawCatchPaddle(catchCtx);
  drawCatchBall(catchCtx);
};

const updateCatchGame = (time) => {
  if (!catchState.running || !catchCtx || !catchCanvas) return;

  if (!catchState.lastTime) catchState.lastTime = time;
  const delta = Math.min(0.05, (time - catchState.lastTime) / 1000);
  const frameScale = delta * 60;
  catchState.lastTime = time;

  const groundY = catchState.groundY;
  catchState.paddle.y = groundY - catchState.paddle.h - Math.max(10, catchCanvas.height * 0.02);

  if (catchState.pointerActive) {
    const target = catchState.pointerX - catchState.paddle.w / 2;
    catchState.paddle.x += (target - catchState.paddle.x) * 0.25;
    catchState.paddle.vx = 0;
  } else {
    const accel = 0.7;
    if (keys.left) catchState.paddle.vx -= accel;
    if (keys.right) catchState.paddle.vx += accel;
    catchState.paddle.vx *= 0.88;
    catchState.paddle.x += catchState.paddle.vx * frameScale;
  }

  catchState.paddle.x = Math.max(0, Math.min(catchCanvas.width - catchState.paddle.w, catchState.paddle.x));

  catchState.ball.y += catchState.speed * frameScale;
  catchState.groundOffset += catchState.speed * frameScale * 2.4;

  const paddleCenter = catchState.paddle.x + catchState.paddle.w / 2;
  const inX =
    catchState.ball.x > catchState.paddle.x &&
    catchState.ball.x < catchState.paddle.x + catchState.paddle.w;
  const hitY = catchState.ball.y + catchState.ball.r >= catchState.paddle.y;

  if (hitY && inX) {
    const centerOffset = Math.abs(catchState.ball.x - paddleCenter);
    const perfect = centerOffset < catchState.paddle.w * 0.18;
    const gain = perfect ? 2 : 1;
    catchState.score += gain;
    catchState.streak += 1;
    catchState.speed = Math.min(12, catchState.speed + 0.35 + catchState.streak * 0.03);
    spawnCatchParticles(catchState.ball.x, catchState.paddle.y, perfect ? "#ffd166" : "#ffffff");
    playCatchSound();
    addProfileMark(1);

    catchState.ball.x = 70 + Math.random() * (catchCanvas.width - 140);
    catchState.ball.y = catchState.ball.r + 8;
  }

  if (catchState.ball.y - catchState.ball.r > catchCanvas.height) {
    catchState.running = false;
    catchState.streak = 0;
    setCatchStatus("Game Over", "game-over");
    playGameOverSound();
    saveCatchBest();
    if (catchSessionActive) {
      recordGameHistory({
        game: "Ball Catch Game",
        action: "Game Over",
        details: `Score: ${catchState.score} | Best: ${catchState.best} | Speed: ${catchState.speed.toFixed(1)}`,
      });
      catchSessionActive = false;
    }
  }

  // Update particles
  catchState.particles.forEach((particle) => {
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.vy += 0.12 * frameScale;
    particle.life -= delta;
  });
  catchState.particles = catchState.particles.filter((particle) => particle.life > 0);

  // Draw
  drawCatchScene();

  updateCatchHud();

  if (catchState.running) {
    requestAnimationFrame(updateCatchGame);
  }
};

if (catchStartBtn) catchStartBtn.addEventListener("click", resetCatchGame);

if (catchCanvas) {
  seedCatchBackground();
  syncCatchGeometry(true);
  setCatchStatus("Ready", "ready");
  loadCatchBest();
  updateCatchHud();
  drawCatchScene();

  const updatePointer = (event) => {
    const rect = catchCanvas.getBoundingClientRect();
    catchState.pointerX = ((event.clientX - rect.left) / rect.width) * catchCanvas.width;
  };

  catchCanvas.addEventListener("pointerdown", (event) => {
    if (!catchState.running) return;
    catchState.pointerActive = true;
    updatePointer(event);
  });
  catchCanvas.addEventListener("pointermove", (event) => {
    if (!catchState.pointerActive) return;
    updatePointer(event);
  });
  const releasePointer = () => {
    catchState.pointerActive = false;
  };
  catchCanvas.addEventListener("pointerup", releasePointer);
  catchCanvas.addEventListener("pointerleave", releasePointer);
  catchCanvas.addEventListener("pointercancel", releasePointer);
}

updateMusicButton();
