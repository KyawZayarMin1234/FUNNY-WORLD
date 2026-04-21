// Pixel Game Tab JavaScript
const sudokuOverlay = document.getElementById("sudoku-overlay");
const memoryOverlay = document.getElementById("memory-overlay");
const puzzleOverlay = document.getElementById("puzzle-overlay");
const tttOverlay = document.getElementById("ttt-overlay");
const openButtons = document.querySelectorAll("[data-open]");
const closeButtons = document.querySelectorAll("[data-close]");
const backToTopButton = document.getElementById("pixel-back-to-top");
let memoryGame = null;

const overlayMap = {
  sudoku: sudokuOverlay,
  memory: memoryOverlay,
  puzzle: puzzleOverlay,
  ttt: tttOverlay,
};

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

let sudokuSessionActive = false;
let memorySessionActive = false;
let puzzleSessionActive = false;
let tttSessionActive = false;

function setOverlay(overlay, isOpen) {
  overlay.classList.toggle("active", isOpen);
  overlay.setAttribute("aria-hidden", String(!isOpen));
}

function openPixelGame(type) {
  Object.keys(overlayMap).forEach((key) => setOverlay(overlayMap[key], key === type));
  document.body.classList.add("game-modal-open");

  if (type === "sudoku") showSudokuSetup();
  if (type === "memory" && memoryGame) memoryGame.open();
  if (type === "puzzle") resetPuzzle();
  if (type === "ttt") resetTtt({ keepMode: false });
}

function closePixelGame(type) {
  if (overlayMap[type]) setOverlay(overlayMap[type], false);
  if (type === "memory" && memoryGame) memoryGame.close();
  if (type === "sudoku") stopSudokuTimer();

  const anyOpen = Object.values(overlayMap).some((overlay) => overlay.classList.contains("active"));
  if (!anyOpen) document.body.classList.remove("game-modal-open");
}

openButtons.forEach((button) => {
  button.addEventListener("click", () => openPixelGame(button.dataset.open));
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => closePixelGame(button.dataset.close));
});

document.addEventListener("keydown", (e) => {
  if (e.code !== "Escape") return;
  Object.keys(overlayMap).forEach((key) => {
    if (overlayMap[key].classList.contains("active")) closePixelGame(key);
  });
});

if (backToTopButton) {
  const toggleBackToTop = () => {
    backToTopButton.classList.toggle("visible", window.scrollY > 220);
  };

  backToTopButton.addEventListener("click", () => {
    const behavior = document.body.classList.contains("reduce-motion") ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
  });

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
}

// ---------------- Sudoku ----------------
const sudokuGrid = document.getElementById("sudoku-grid");
const sudokuMsg = document.getElementById("sudoku-msg");
const sudokuCheckBtn = document.getElementById("sudoku-check");
const sudokuNewBtn = document.getElementById("sudoku-new");
const sudokuSetup = document.getElementById("sudoku-setup");
const sudokuPlay = document.getElementById("sudoku-play");
const sudokuDifficultyMsg = document.getElementById("sudoku-difficulty-msg");
const difficultyButtons = document.querySelectorAll("#sudoku-setup [data-difficulty]");
const sudokuTutorial = document.getElementById("sudoku-tutorial");
const sudokuTutorialOk = document.getElementById("sudoku-tutorial-ok");
const sudokuTimeEl = document.getElementById("sudoku-time");
const sudokuStatsBtn = document.getElementById("sudoku-stats-btn");
const sudokuSettingsBtn = document.getElementById("sudoku-settings-btn");
const sudokuThemeBtn = document.getElementById("sudoku-theme-btn");
const sudokuDifficultyBadge = document.getElementById("sudoku-difficulty-badge");
const globalSettingsButton = document.querySelector(".nav-settings");
const globalThemeInputs = document.querySelectorAll('#settings-overlay input[data-setting="theme"]');
const sudokuBackBtn = document.getElementById("sudoku-back");
const sudokuPlaySettingsBtn = document.getElementById("sudoku-play-settings");
const sudokuProgressCount = document.getElementById("sudoku-progress-count");
const sudokuProgressFill = document.getElementById("sudoku-progress-fill");
const sudokuUndoBtn = document.getElementById("sudoku-undo");
const sudokuEraseBtn = document.getElementById("sudoku-erase");
const sudokuNotesToggle = document.getElementById("sudoku-notes-toggle");
const sudokuNumberButtons = document.querySelectorAll("[data-sudoku-number]");
const sudokuPlayDifficultyButtons = document.querySelectorAll("[data-sudoku-play-difficulty]");
const sudokuGameLayout = document.querySelector(".sudoku-game-layout");
const sudokuGameCenter = document.querySelector(".sudoku-game-center");
const sudokuGameSideLeft = document.querySelector(".sudoku-game-side-left");
const sudokuGameSideRight = document.querySelector(".sudoku-game-side-right");
const sudokuGameDifficultyCard = document.querySelector(".sudoku-game-difficulty-card");
const sudokuGameProgressCard = document.querySelector(".sudoku-game-progress-card");
const sudokuGameToolsCard = document.querySelector(".sudoku-game-tools-card");

let sudokuMobileStack = null;

const SUDOKU_DEFAULT_SETUP_MESSAGE = "Every number has a place. Can you find them all?";
const SUDOKU_STATS_MESSAGE = "Rewards: Easy +5, Medium +8, Hard +12, Expert +15.";

const sudokuPuzzles = [
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  [
    [0, 2, 0, 6, 0, 8, 0, 0, 0],
    [5, 8, 0, 0, 0, 9, 7, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 0],
    [3, 7, 0, 0, 0, 0, 5, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 8, 0, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 9, 8, 0, 0, 0, 3, 6],
    [0, 0, 0, 3, 0, 6, 0, 9, 0],
  ],
];

let currentPuzzle = null;
let currentDifficulty = null;
let sudokuTimerId = null;
let sudokuElapsed = 0;
let sudokuStarted = false;
let sudokuAwarded = false;
let currentSudokuValues = [];
let currentSudokuNotes = [];
let sudokuSelectedCell = null;
let sudokuUndoStack = [];
let sudokuNotesMode = false;

const difficultyRemovals = {
  easy: 0,
  medium: 6,
  hard: 12,
  expert: 18,
};

const difficultyMarks = {
  easy: 5,
  medium: 8,
  hard: 12,
  expert: 15,
};

function clonePuzzle(puzzle) {
  return puzzle.map((row) => row.slice());
}

function formatSudokuTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatSudokuDifficultyLabel(difficulty) {
  const labelMap = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
  };
  return labelMap[difficulty] || "Easy";
}

function syncSudokuDifficultyBadge(difficulty = currentDifficulty || "easy") {
  if (sudokuDifficultyBadge) sudokuDifficultyBadge.textContent = formatSudokuDifficultyLabel(difficulty);
}

function syncSudokuDifficultyState(difficulty = currentDifficulty) {
  difficultyButtons.forEach((button) => {
    const active = Boolean(difficulty) && button.dataset.difficulty === difficulty;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  sudokuPlayDifficultyButtons.forEach((button) => {
    const active = Boolean(difficulty) && button.dataset.sudokuPlayDifficulty === difficulty;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  syncSudokuDifficultyBadge(difficulty || "easy");
}

function persistSudokuTheme(theme) {
  const themeInput = Array.from(globalThemeInputs).find((input) => input.value === theme);
  if (themeInput) {
    themeInput.checked = true;
    themeInput.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  document.body.dataset.theme = theme;
  try {
    const raw = localStorage.getItem("fgh-settings");
    const saved = raw ? JSON.parse(raw) : {};
    const next = saved && typeof saved === "object" ? saved : {};
    next.theme = theme;
    localStorage.setItem("fgh-settings", JSON.stringify(next));
  } catch (error) {
    // Ignore storage issues and still update the current page theme.
  }
}

function ensureSudokuMobileStack() {
  if (sudokuMobileStack) return sudokuMobileStack;
  if (!sudokuGameCenter) return null;

  sudokuMobileStack = document.createElement("div");
  sudokuMobileStack.className = "sudoku-mobile-stack";
  return sudokuMobileStack;
}

function isSudokuPhoneLayout() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function syncSudokuResponsiveLayout() {
  if (
    !sudokuOverlay ||
    !sudokuGameCenter ||
    !sudokuGameSideLeft ||
    !sudokuGameSideRight ||
    !sudokuGameDifficultyCard ||
    !sudokuGameProgressCard ||
    !sudokuGameToolsCard ||
    !sudokuNewBtn
  ) {
    return;
  }

  const mobileStack = ensureSudokuMobileStack();
  if (!mobileStack) return;

  if (isSudokuPhoneLayout()) {
    sudokuOverlay.classList.add("sudoku-mobile-mode");
    if (!mobileStack.isConnected) sudokuGameCenter.appendChild(mobileStack);
    mobileStack.append(sudokuGameToolsCard, sudokuNewBtn, sudokuGameDifficultyCard, sudokuGameProgressCard);
    return;
  }

  sudokuOverlay.classList.remove("sudoku-mobile-mode");
  sudokuGameSideLeft.append(sudokuGameDifficultyCard, sudokuGameProgressCard);
  sudokuGameSideRight.append(sudokuGameToolsCard, sudokuNewBtn);
  mobileStack.remove();
}

function updateSudokuTime() {
  if (sudokuTimeEl) sudokuTimeEl.textContent = formatSudokuTime(sudokuElapsed);
}

function startSudokuTimer() {
  if (sudokuTimerId) return;
  sudokuStarted = true;
  sudokuTimerId = setInterval(() => {
    sudokuElapsed += 1;
    updateSudokuTime();
  }, 1000);
}

function stopSudokuTimer() {
  if (sudokuTimerId) {
    clearInterval(sudokuTimerId);
    sudokuTimerId = null;
  }
}

function resetSudokuTimer() {
  stopSudokuTimer();
  sudokuElapsed = 0;
  sudokuStarted = false;
  updateSudokuTime();
}

function createSudokuNotesMatrix() {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
}

function cloneSudokuNotes(notes) {
  return notes.map((row) => row.map((cell) => cell.slice()));
}

function snapshotSudokuState() {
  return {
    values: clonePuzzle(currentSudokuValues),
    notes: cloneSudokuNotes(currentSudokuNotes),
    selected: sudokuSelectedCell ? { ...sudokuSelectedCell } : null,
  };
}

function restoreSudokuState(snapshot) {
  currentSudokuValues = clonePuzzle(snapshot.values);
  currentSudokuNotes = cloneSudokuNotes(snapshot.notes);
  sudokuSelectedCell = snapshot.selected ? { ...snapshot.selected } : null;
}

function pushSudokuUndoState() {
  sudokuUndoStack.push(snapshotSudokuState());
  if (sudokuUndoStack.length > 200) sudokuUndoStack.shift();
}

function isSudokuCellEditable(row, col) {
  return currentPuzzle && currentPuzzle[row]?.[col] === 0;
}

function isSameSudokuBox(aRow, aCol, bRow, bCol) {
  return Math.floor(aRow / 3) === Math.floor(bRow / 3) && Math.floor(aCol / 3) === Math.floor(bCol / 3);
}

function findInitialSudokuSelection(puzzle) {
  if (!puzzle) return null;
  const preferred = [
    [4, 4],
    [4, 3],
    [4, 5],
    [3, 4],
    [5, 4],
  ];

  for (const [row, col] of preferred) {
    if (puzzle[row]?.[col] === 0) return { row, col };
  }

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (puzzle[row][col] === 0) return { row, col };
    }
  }

  return { row: 0, col: 0 };
}

function buildSudokuConflictSet(values = currentSudokuValues) {
  const conflicts = new Set();
  const collectConflicts = (cells) => {
    const seen = new Map();
    cells.forEach(([row, col]) => {
      const value = values[row][col];
      if (!value) return;
      if (!seen.has(value)) seen.set(value, []);
      seen.get(value).push([row, col]);
    });
    seen.forEach((positions) => {
      if (positions.length < 2) return;
      positions.forEach(([row, col]) => conflicts.add(`${row}-${col}`));
    });
  };

  for (let row = 0; row < 9; row += 1) {
    collectConflicts(Array.from({ length: 9 }, (_, col) => [row, col]));
  }

  for (let col = 0; col < 9; col += 1) {
    collectConflicts(Array.from({ length: 9 }, (_, row) => [row, col]));
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const cells = [];
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
          cells.push([row, col]);
        }
      }
      collectConflicts(cells);
    }
  }

  return conflicts;
}

function evaluateSudokuBoard(values = currentSudokuValues) {
  const conflicts = buildSudokuConflictSet(values);
  let hasEmpty = false;

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (values[row][col] === 0) hasEmpty = true;
    }
  }

  return {
    conflicts,
    hasEmpty,
    hasError: conflicts.size > 0,
  };
}

function updateSudokuProgress() {
  if (!sudokuProgressCount || !sudokuProgressFill) return;

  if (!currentPuzzle || !currentSudokuValues.length) {
    sudokuProgressCount.textContent = "0 / 81";
    sudokuProgressFill.style.width = "0%";
    return;
  }

  let filledByPlayer = 0;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (currentPuzzle[row][col] === 0 && currentSudokuValues[row][col] !== 0) {
        filledByPlayer += 1;
      }
    }
  }

  sudokuProgressCount.textContent = `${filledByPlayer} / 81`;
  sudokuProgressFill.style.width = `${(filledByPlayer / 81) * 100}%`;
}

function updateSudokuStatus(state = evaluateSudokuBoard()) {
  if (!sudokuMsg) return;

  if (state.hasError) {
    sudokuMsg.textContent = "Oops, a rule is broken.";
    return;
  }

  if (!state.hasEmpty) {
    sudokuMsg.textContent = "Nice! Looks solved.";
    if (!sudokuAwarded) {
      const reward = difficultyMarks[currentDifficulty] ?? 5;
      addProfileMark(reward);
      sudokuAwarded = true;
    }
    if (sudokuSessionActive) {
      recordGameHistory({
        game: "Sudoku",
        action: "Completed",
        details: `Difficulty: ${formatSudokuDifficultyLabel(currentDifficulty)} | Time: ${formatSudokuTime(sudokuElapsed)}`,
      });
      sudokuSessionActive = false;
    }
    stopSudokuTimer();
    return;
  }

  sudokuMsg.textContent = "";
}

function updateSudokuControls() {
  const hasSelection = Boolean(sudokuSelectedCell);
  const editableSelection = hasSelection && isSudokuCellEditable(sudokuSelectedCell.row, sudokuSelectedCell.col);
  const selectedValue =
    editableSelection && currentSudokuValues.length
      ? currentSudokuValues[sudokuSelectedCell.row][sudokuSelectedCell.col]
      : 0;
  const selectedNotes =
    editableSelection && currentSudokuNotes.length
      ? currentSudokuNotes[sudokuSelectedCell.row][sudokuSelectedCell.col]
      : [];

  if (sudokuUndoBtn) sudokuUndoBtn.disabled = sudokuUndoStack.length === 0;
  if (sudokuEraseBtn) sudokuEraseBtn.disabled = !editableSelection || (selectedValue === 0 && selectedNotes.length === 0);
  if (sudokuNotesToggle) {
    sudokuNotesToggle.classList.toggle("active", sudokuNotesMode);
    sudokuNotesToggle.setAttribute("aria-pressed", String(sudokuNotesMode));
  }
}

function createSudokuNotesMarkup(notes) {
  const notesGrid = document.createElement("div");
  notesGrid.className = "sudoku-cell-notes";

  for (let value = 1; value <= 9; value += 1) {
    const note = document.createElement("span");
    note.textContent = notes.includes(value) ? String(value) : "";
    notesGrid.appendChild(note);
  }

  return notesGrid;
}

function renderSudokuBoard() {
  if (!sudokuGrid || !currentPuzzle || !currentSudokuValues.length) return;

  const state = evaluateSudokuBoard();
  const selected = sudokuSelectedCell;
  const selectedValue = selected ? currentSudokuValues[selected.row][selected.col] : 0;

  sudokuGrid.innerHTML = "";

  currentSudokuValues.forEach((rowValues, row) => {
    rowValues.forEach((value, col) => {
      const cell = document.createElement("button");
      const locked = !isSudokuCellEditable(row, col);
      const notes = currentSudokuNotes[row][col];
      const key = `${row}-${col}`;
      const isSelected = Boolean(selected) && selected.row === row && selected.col === col;
      const isPeer =
        Boolean(selected) &&
        !isSelected &&
        (selected.row === row || selected.col === col || isSameSudokuBox(selected.row, selected.col, row, col));
      const isMatched = Boolean(selectedValue) && value === selectedValue;

      cell.type = "button";
      cell.className = "sudoku-cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.classList.toggle("locked", locked);
      cell.classList.toggle("editable", !locked);
      cell.classList.toggle("is-selected", isSelected);
      cell.classList.toggle("is-peer", isPeer);
      cell.classList.toggle("is-matched", isMatched);
      cell.classList.toggle("is-conflict", state.conflicts.has(key));
      cell.setAttribute(
        "aria-label",
        `Row ${row + 1} Column ${col + 1}${value ? `, ${value}` : ", empty"}${locked ? ", fixed" : ""}`,
      );
      cell.setAttribute("aria-pressed", String(isSelected));

      if (value) {
        const valueEl = document.createElement("span");
        valueEl.className = "sudoku-cell-value";
        valueEl.textContent = String(value);
        cell.appendChild(valueEl);
      } else if (notes.length) {
        cell.appendChild(createSudokuNotesMarkup(notes));
      }

      cell.addEventListener("click", () => {
        sudokuSelectedCell = { row, col };
        renderSudokuBoard();
      });

      sudokuGrid.appendChild(cell);
    });
  });

  updateSudokuProgress();
  updateSudokuStatus(state);
  updateSudokuControls();
}

function applySudokuValue(value) {
  if (!currentPuzzle) return;
  if (!sudokuSelectedCell) sudokuSelectedCell = findInitialSudokuSelection(currentPuzzle);
  if (!sudokuSelectedCell || !isSudokuCellEditable(sudokuSelectedCell.row, sudokuSelectedCell.col)) {
    renderSudokuBoard();
    return;
  }

  const { row, col } = sudokuSelectedCell;
  const currentValue = currentSudokuValues[row][col];
  const currentNotes = currentSudokuNotes[row][col];

  if (sudokuNotesMode) {
    if (currentValue !== 0) return;

    const nextNotes = currentNotes.includes(value)
      ? currentNotes.filter((note) => note !== value)
      : [...currentNotes, value].sort((a, b) => a - b);

    if (nextNotes.length === currentNotes.length && nextNotes.every((note, index) => note === currentNotes[index])) {
      return;
    }

    pushSudokuUndoState();
    currentSudokuNotes[row][col] = nextNotes;
  } else {
    if (currentValue === value && currentNotes.length === 0) return;
    pushSudokuUndoState();
    currentSudokuValues[row][col] = value;
    currentSudokuNotes[row][col] = [];
  }

  if (!sudokuStarted) startSudokuTimer();
  renderSudokuBoard();
}

function eraseSudokuValue() {
  if (!sudokuSelectedCell || !isSudokuCellEditable(sudokuSelectedCell.row, sudokuSelectedCell.col)) {
    renderSudokuBoard();
    return;
  }

  const { row, col } = sudokuSelectedCell;
  const currentValue = currentSudokuValues[row][col];
  const currentNotes = currentSudokuNotes[row][col];

  if (currentValue === 0 && currentNotes.length === 0) return;

  pushSudokuUndoState();
  currentSudokuValues[row][col] = 0;
  currentSudokuNotes[row][col] = [];
  renderSudokuBoard();
}

function undoSudokuMove() {
  const previous = sudokuUndoStack.pop();
  if (!previous) return;
  restoreSudokuState(previous);
  renderSudokuBoard();
}

function toggleSudokuNotesMode() {
  sudokuNotesMode = !sudokuNotesMode;
  updateSudokuControls();
}

function makePuzzle(base, removeCount) {
  const puzzle = clonePuzzle(base);
  const filled = [];
  puzzle.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value !== 0) filled.push([r, c]);
    });
  });
  shuffle(filled);
  const limit = Math.min(removeCount, filled.length);
  for (let i = 0; i < limit; i += 1) {
    const [r, c] = filled[i];
    puzzle[r][c] = 0;
  }
  return puzzle;
}

function showSudokuSetup(options = {}) {
  const { showTutorial = true, preserveDifficulty = false } = options;

  resetSudokuTimer();
  sudokuAwarded = false;
  sudokuNotesMode = false;
  sudokuUndoStack = [];
  sudokuSelectedCell = null;
  currentPuzzle = null;
  currentSudokuValues = [];
  currentSudokuNotes = [];
  if (sudokuOverlay) sudokuOverlay.classList.remove("sudoku-playing");
  if (sudokuSetup) sudokuSetup.style.display = showTutorial ? "none" : "grid";
  if (sudokuPlay) sudokuPlay.classList.remove("active");
  if (sudokuGrid) sudokuGrid.innerHTML = "";
  if (sudokuMsg) sudokuMsg.textContent = "";
  if (sudokuDifficultyMsg) sudokuDifficultyMsg.textContent = SUDOKU_DEFAULT_SETUP_MESSAGE;
  if (!preserveDifficulty) currentDifficulty = null;
  if (sudokuTutorial) sudokuTutorial.classList.toggle("hidden", !showTutorial);
  syncSudokuResponsiveLayout();
  syncSudokuDifficultyState(currentDifficulty);
  updateSudokuProgress();
  updateSudokuControls();
}

function startSudoku() {
  if (!currentDifficulty) return;
  if (sudokuOverlay) sudokuOverlay.classList.add("sudoku-playing");
  if (sudokuSetup) sudokuSetup.style.display = "none";
  if (sudokuTutorial) sudokuTutorial.classList.add("hidden");
  if (sudokuPlay) sudokuPlay.classList.add("active");
  syncSudokuResponsiveLayout();
  syncSudokuDifficultyState(currentDifficulty);
  newSudoku(currentDifficulty);
}

function getSudokuValues() {
  return clonePuzzle(currentSudokuValues);
}

function hasDuplicates(arr) {
  const nums = arr.filter((n) => n !== 0);
  return new Set(nums).size !== nums.length;
}

function checkSudoku() {
  if (!currentSudokuValues.length) return;
  const state = evaluateSudokuBoard();
  updateSudokuStatus(state);
  renderSudokuBoard();
}

function newSudoku(difficulty = currentDifficulty || "easy") {
  resetSudokuTimer();
  sudokuAwarded = false;
  sudokuNotesMode = false;
  sudokuUndoStack = [];
  currentDifficulty = difficulty;
  const base = sudokuPuzzles[Math.floor(Math.random() * sudokuPuzzles.length)];
  const removeCount = difficultyRemovals[difficulty] ?? 0;
  currentPuzzle = makePuzzle(base, removeCount);
  currentSudokuValues = clonePuzzle(currentPuzzle);
  currentSudokuNotes = createSudokuNotesMatrix();
  sudokuSelectedCell = findInitialSudokuSelection(currentPuzzle);
  syncSudokuDifficultyState(difficulty);
  if (sudokuMsg) sudokuMsg.textContent = "";
  renderSudokuBoard();
  sudokuSessionActive = true;
  recordGameHistory({
    game: "Sudoku",
    action: "Started",
    details: `Difficulty: ${formatSudokuDifficultyLabel(difficulty)}`,
  });
}

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentDifficulty = button.dataset.difficulty || "easy";
    syncSudokuDifficultyState(currentDifficulty);
    if (sudokuDifficultyMsg) {
      sudokuDifficultyMsg.textContent = "Starting " + formatSudokuDifficultyLabel(currentDifficulty) + "...";
    }
    startSudoku();
  });
});

sudokuPlayDifficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentDifficulty = button.dataset.sudokuPlayDifficulty || "easy";
    syncSudokuDifficultyState(currentDifficulty);
    newSudoku(currentDifficulty);
  });
});

sudokuTutorialOk?.addEventListener("click", () => {
  if (sudokuTutorial) sudokuTutorial.classList.add("hidden");
  if (sudokuSetup) sudokuSetup.style.display = "grid";
});

sudokuStatsBtn?.addEventListener("click", () => {
  if (sudokuDifficultyMsg) sudokuDifficultyMsg.textContent = SUDOKU_STATS_MESSAGE;
});

sudokuSettingsBtn?.addEventListener("click", () => {
  if (globalSettingsButton) {
    globalSettingsButton.click();
    return;
  }
  if (sudokuTutorial) sudokuTutorial.classList.remove("hidden");
});

sudokuThemeBtn?.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  persistSudokuTheme(nextTheme);
});

sudokuBackBtn?.addEventListener("click", () => {
  showSudokuSetup({ showTutorial: false, preserveDifficulty: true });
});

sudokuPlaySettingsBtn?.addEventListener("click", () => {
  if (globalSettingsButton) {
    globalSettingsButton.click();
  }
});

sudokuUndoBtn?.addEventListener("click", undoSudokuMove);
sudokuEraseBtn?.addEventListener("click", eraseSudokuValue);
sudokuNotesToggle?.addEventListener("click", toggleSudokuNotesMode);
sudokuNumberButtons.forEach((button) => {
  button.addEventListener("click", () => applySudokuValue(Number(button.dataset.sudokuNumber)));
});

window.addEventListener("resize", syncSudokuResponsiveLayout);
syncSudokuResponsiveLayout();

document.addEventListener("keydown", (event) => {
  if (!sudokuOverlay?.classList.contains("active") || !sudokuPlay?.classList.contains("active")) return;
  const target = event.target;

  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

  if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    applySudokuValue(Number(event.key));
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    event.preventDefault();
    eraseSudokuValue();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoSudokuMove();
    return;
  }

  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    toggleSudokuNotesMode();
    return;
  }

  const movement = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  }[event.key];

  if (!movement || !currentPuzzle) return;

  event.preventDefault();
  if (!sudokuSelectedCell) {
    sudokuSelectedCell = findInitialSudokuSelection(currentPuzzle);
    renderSudokuBoard();
    return;
  }

  sudokuSelectedCell = {
    row: Math.min(8, Math.max(0, sudokuSelectedCell.row + movement[0])),
    col: Math.min(8, Math.max(0, sudokuSelectedCell.col + movement[1])),
  };
  renderSudokuBoard();
});

sudokuCheckBtn?.addEventListener("click", checkSudoku);
sudokuNewBtn?.addEventListener("click", () => newSudoku(currentDifficulty || "easy"));
showSudokuSetup();

// ---------------- Memory Match ----------------
const memoryGrid = document.getElementById("memory-grid");
const memoryBoard = document.querySelector(".memory-board");
const memoryMsg = document.getElementById("memory-msg");
const memoryDifficultyEl = document.getElementById("memory-difficulty");
const memoryModeEl = document.getElementById("memory-mode");
const memoryScoreEl = document.getElementById("memory-score");
const memoryMovesEl = document.getElementById("memory-moves");
const memoryComboEl = document.getElementById("memory-combo");
const memoryBestStreakEl = document.getElementById("memory-best-streak");
const memoryEfficiencyEl = document.getElementById("memory-efficiency");
const memoryBestMovesEl = document.getElementById("memory-best-moves");
const memoryPlayerEl = document.getElementById("memory-player");
const memoryTimeEl = document.getElementById("memory-time");

const memoryStartBtn = document.getElementById("memory-start");
const memoryPauseBtn = document.getElementById("memory-pause");
const memoryNewBtn = document.getElementById("memory-new");
const memoryHintBtn = document.getElementById("memory-hint");
const memoryHintCount = document.getElementById("memory-hint-count");
const memorySettingsToggle = document.getElementById("memory-settings-toggle");
const memoryLeaderboardToggle = document.getElementById("memory-leaderboard-toggle");
const memoryStatsToggle = document.getElementById("memory-stats-toggle");
const memoryShareBtn = document.getElementById("memory-share");
const memoryPanels = document.getElementById("memory-panels");
const memorySpeedLabel = document.getElementById("memory-speed-label");
const memoryPanelCloseButtons = document.querySelectorAll(".memory-panel-close");
const memoryResult = document.getElementById("memory-result");
const memoryResultTitle = document.getElementById("memory-result-title");
const memoryResultScore = document.getElementById("memory-result-score");
const memoryResultMoves = document.getElementById("memory-result-moves");
const memoryResultTime = document.getElementById("memory-result-time");
const memoryResultCombo = document.getElementById("memory-result-combo");
const memoryResultRestart = document.getElementById("memory-result-restart");
const memoryResultClose = document.getElementById("memory-result-close");

const memorySettingsPanel = document.getElementById("memory-settings");
const memorySettingPlayer = document.getElementById("memory-setting-player");
const memorySettingDifficulty = document.getElementById("memory-setting-difficulty");
const memorySettingMode = document.getElementById("memory-setting-mode");
const memorySettingTheme = document.getElementById("memory-setting-theme");
const memorySettingSound = document.getElementById("memory-setting-sound");
const memorySettingSpeed = document.getElementById("memory-setting-speed");
const memorySettingsApply = document.getElementById("memory-settings-apply");
const memorySettingsReset = document.getElementById("memory-settings-reset");

const memoryLeaderboardPanel = document.getElementById("memory-leaderboard");
const memoryLeaderboardFilter = document.getElementById("memory-leaderboard-filter");
const memoryLeaderboardBody = document.getElementById("memory-leaderboard-body");

const memoryStatsPanel = document.getElementById("memory-stats");
const memoryStatGames = document.getElementById("memory-stat-games");
const memoryStatWinrate = document.getElementById("memory-stat-winrate");
const memoryStatAvgTime = document.getElementById("memory-stat-avgtime");
const memoryStatMatches = document.getElementById("memory-stat-matches");
const memoryStatBestEasy = document.getElementById("memory-stat-best-easy");
const memoryStatBestMedium = document.getElementById("memory-stat-best-medium");
const memoryStatBestHard = document.getElementById("memory-stat-best-hard");
const memoryStatTotalTime = document.getElementById("memory-stat-total-time");
const memoryProgressSummary = document.getElementById("memory-progress-summary");
const memoryProgressFill = document.getElementById("memory-progress-fill");
const memoryThemeCard = document.getElementById("memory-theme-card");
const memoryThemeName = document.getElementById("memory-theme-name");
const memoryThemePreview = document.getElementById("memory-theme-preview");
const memorySoundToggle = document.getElementById("memory-sound-toggle");
const memorySoundState = document.getElementById("memory-sound-state");

const MEMORY_STORAGE_KEY = "fgh-memory-settings-v2";
const MEMORY_STATS_KEY = "fgh-memory-stats";
const MEMORY_LEADERBOARD_KEY = "fgh-memory-leaderboard";
const MEMORY_BEST_MOVES_KEY = "fgh-memory-best-moves";

const MEMORY_DIFFICULTY = {
  easy: { rows: 3, cols: 4, pairs: 6, timeLimit: 0, label: "Easy" },
  medium: { rows: 4, cols: 4, pairs: 8, timeLimit: 180, label: "Medium" },
  hard: { rows: 6, cols: 6, pairs: 18, timeLimit: 300, label: "Hard" },
};

const MEMORY_MODES = {
  classic: "Classic",
  "time-attack": "Time Attack",
  practice: "Practice",
};

const MEMORY_THEMES = {
  animals: [
    "\u{1F436}", "\u{1F431}", "\u{1F42D}", "\u{1F439}", "\u{1F430}", "\u{1F98A}",
    "\u{1F43B}", "\u{1F43C}", "\u{1F428}", "\u{1F42F}", "\u{1F981}", "\u{1F42E}",
    "\u{1F437}", "\u{1F438}", "\u{1F435}", "\u{1F414}", "\u{1F427}", "\u{1F424}"
  ],
  emoji: [
    "\u{1F600}", "\u{1F602}", "\u{1F60E}", "\u{1F970}", "\u{1F60D}", "\u{1F914}",
    "\u{1F929}", "\u{1F607}", "\u{1F61B}", "\u{1F92A}", "\u{1F92F}", "\u{1F920}",
    "\u{1F60A}", "\u{1F60B}", "\u{1F604}", "\u{1F60C}", "\u{1F973}", "\u{1F923}"
  ],
  numbers: [
    "\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469",
    "\u246A", "\u246B", "\u246C", "\u246D", "\u246E", "\u246F", "\u2470", "\u2471"
  ],
  space: [
    "\u{1F30D}", "\u{1F315}", "\u{1F680}", "\u{1F47D}", "\u{1F6F8}", "\u2B50",
    "\u{1FA90}", "\u{1F30C}", "\u{1F320}", "\u{1F311}", "\u{1F30E}", "\u{1F31F}",
    "\u2604\uFE0F", "\u{1F6F0}\uFE0F", "\u2600\uFE0F", "\u{1F52D}", "\u{1F312}", "\u{1F30B}"
  ],
  food: [
    "\u{1F355}", "\u{1F354}", "\u{1F35F}", "\u{1F32D}", "\u{1F366}", "\u{1F369}",
    "\u{1F370}", "\u{1F368}", "\u{1F36A}", "\u{1F36B}", "\u{1F37F}", "\u{1F363}",
    "\u{1F957}", "\u{1F353}", "\u{1F347}", "\u{1F349}", "\u{1F951}", "\u{1F35C}"
  ],
};

const MEMORY_SPEED = {
  slow: 550,
  normal: 350,
  fast: 220,
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

class MemoryTimer {
  constructor(onTick, onExpire) {
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.interval = null;
    this.elapsed = 0;
    this.remaining = 0;
    this.countdown = false;
  }

  start(seconds, countdown) {
    this.stop();
    this.countdown = countdown;
    this.elapsed = 0;
    this.remaining = seconds;
    if (this.onTick) this.onTick(this.countdown ? this.remaining : this.elapsed);
    this.interval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    if (this.countdown) {
      this.remaining = Math.max(0, this.remaining - 1);
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onExpire) this.onExpire();
      }
    } else {
      this.elapsed += 1;
      if (this.onTick) this.onTick(this.elapsed);
    }
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resume() {
    if (!this.interval) {
      this.interval = setInterval(() => this.tick(), 1000);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

class MemoryAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  play(freq, duration, type = "sine") {
    if (!this.enabled) return;
    if (!this.ensure()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);
  }
}

class MemoryLeaderboard {
  constructor(key) {
    this.key = key;
  }

  loadAll() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : { easy: [], medium: [], hard: [] };
    } catch (error) {
      return { easy: [], medium: [], hard: [] };
    }
  }

  saveAll(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      // ignore
    }
  }

  add(entry) {
    const data = this.loadAll();
    const list = data[entry.difficulty] || [];
    list.push(entry);
    list.sort((a, b) => b.score - a.score || a.moves - b.moves || a.time - b.time);
    data[entry.difficulty] = list.slice(0, 10);
    this.saveAll(data);
  }

  get(difficulty) {
    const data = this.loadAll();
    return data[difficulty] || [];
  }
}

class MemoryMatch {
  constructor() {
    this.settings = {
      difficulty: "easy",
      mode: "classic",
      theme: "animals",
      sound: true,
      speed: "normal",
      player: "Player",
    };

    this.state = {
      running: false,
      paused: false,
      lock: false,
      first: null,
      second: null,
      moves: 0,
      matches: 0,
      score: 0,
      combo: 0,
      bestStreak: 0,
      hintsLeft: 3,
      focusIndex: 0,
    };

    this.cards = [];
    this.timer = new MemoryTimer((value) => this.updateTime(value), () => this.timeUp());
    this.audio = new MemoryAudio();
    this.leaderboard = new MemoryLeaderboard(MEMORY_LEADERBOARD_KEY);
    this.modalPaused = false;
    this.layoutFrame = null;
    this.resizeObserver = null;
  }

  init() {
    this.loadSettings();
    this.applySettingsToUI();
    this.bindEvents();
    this.buildBoard();
    this.updateHud();
    this.renderStats();
  }

  bindEvents() {
    memoryStartBtn?.addEventListener("click", () => this.startGame());
    memoryPauseBtn?.addEventListener("click", () => this.togglePause());
    memoryNewBtn?.addEventListener("click", () => this.startGame());
    memoryHintBtn?.addEventListener("click", () => this.useHint());
    memorySettingsToggle?.addEventListener("click", () => this.togglePanel(memorySettingsPanel));
    memoryLeaderboardToggle?.addEventListener("click", () => this.togglePanel(memoryLeaderboardPanel));
    memoryStatsToggle?.addEventListener("click", () => this.togglePanel(memoryStatsPanel));
    memoryThemeCard?.addEventListener("click", () => this.togglePanel(memorySettingsPanel));
    memorySoundToggle?.addEventListener("click", () => this.toggleSound());
    memoryShareBtn?.addEventListener("click", () => this.shareScore());
    memorySettingsApply?.addEventListener("click", () => this.applySettings());
    memorySettingsReset?.addEventListener("click", () => this.resetSettings());
    memoryLeaderboardFilter?.addEventListener("change", () => this.renderLeaderboard());
    memorySettingSpeed?.addEventListener("input", () => this.updateSpeedLabel());
    memoryPanelCloseButtons.forEach((button) => {
      button.addEventListener("click", () => this.hidePanels());
    });
    memoryResultRestart?.addEventListener("click", () => this.startGame());
    memoryResultClose?.addEventListener("click", () => this.hideResult());

    document.addEventListener("keydown", (event) => {
      if (!memoryOverlay.classList.contains("active")) return;
      if (event.code === "KeyR") {
        this.startGame();
      }
      if (event.code === "Space" || event.code === "Enter") {
        if (document.activeElement && document.activeElement.classList.contains("memory-card")) {
          event.preventDefault();
          document.activeElement.click();
        }
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)) {
        this.moveFocus(event.code);
      }
    });

    window.addEventListener("resize", () => this.scheduleLayoutFit());
    if ("ResizeObserver" in window && memoryBoard) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutFit());
      this.resizeObserver.observe(memoryBoard);
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this.scheduleLayoutFit()).catch(() => {});
    }
  }

  open() {
    this.updateHud();
    this.renderLeaderboard();
    this.renderStats();
    if (!this.state.running) {
      this.startGame();
    } else {
      this.scheduleLayoutFit();
    }
  }

  setCardFace(cardEl, showFront) {
    const front = cardEl.querySelector(".memory-card-front");
    const back = cardEl.querySelector(".memory-card-back");
    if (!front || !back) return;
    front.style.display = "flex";
    back.style.display = "flex";
    front.setAttribute("aria-hidden", showFront ? "false" : "true");
    back.setAttribute("aria-hidden", showFront ? "true" : "false");
  }

  close() {
    this.pauseGame(true);
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      // ignore
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      // ignore
    }
  }

  applySettingsToUI() {
    if (memorySettingDifficulty) memorySettingDifficulty.value = this.settings.difficulty;
    if (memorySettingMode) memorySettingMode.value = this.settings.mode;
    if (memorySettingTheme) memorySettingTheme.value = this.settings.theme;
    if (memorySettingSound) memorySettingSound.checked = this.settings.sound;
    if (memorySettingSpeed) memorySettingSpeed.value = String(this.speedToSlider(this.settings.speed));
    if (memorySettingPlayer) memorySettingPlayer.value = this.settings.player;
    if (memoryLeaderboardFilter) memoryLeaderboardFilter.value = this.settings.difficulty;
    if (memoryPlayerEl) memoryPlayerEl.textContent = this.settings.player;
    this.audio.enabled = this.settings.sound;
    this.updateSpeedLabel();
  }

  applySettings() {
    this.settings.difficulty = memorySettingDifficulty?.value || "easy";
    this.settings.mode = memorySettingMode?.value || "classic";
    this.settings.theme = memorySettingTheme?.value || "space";
    this.settings.sound = Boolean(memorySettingSound?.checked);
    this.settings.speed = this.sliderToSpeed(Number(memorySettingSpeed?.value || 1));
    this.settings.player = memorySettingPlayer?.value?.trim() || "Player";
    this.audio.enabled = this.settings.sound;
    this.saveSettings();
    this.hidePanels();
    this.startGame();
  }

  resetSettings() {
    this.settings = {
      difficulty: "easy",
      mode: "classic",
      theme: "animals",
      sound: true,
      speed: "normal",
      player: "Player",
    };
    this.applySettingsToUI();
    this.saveSettings();
    this.startGame();
  }

  sliderToSpeed(value) {
    if (value === 0) return "slow";
    if (value === 2) return "fast";
    return "normal";
  }

  speedToSlider(speed) {
    if (speed === "slow") return 0;
    if (speed === "fast") return 2;
    return 1;
  }

  updateSpeedLabel() {
    if (!memorySpeedLabel || !memorySettingSpeed) return;
    const label = this.sliderToSpeed(Number(memorySettingSpeed.value));
    memorySpeedLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  togglePanel(panel) {
    if (!panel) return;
    const isHidden = panel.classList.contains("hidden");
    this.hidePanels();
    panel.classList.toggle("hidden", !isHidden);
    const nowOpen = !panel.classList.contains("hidden");
    this.setPanelState(nowOpen && panel === memorySettingsPanel);
    if (memoryPanels) memoryPanels.classList.toggle("active", nowOpen);
  }

  hidePanels() {
    memorySettingsPanel?.classList.add("hidden");
    memoryLeaderboardPanel?.classList.add("hidden");
    memoryStatsPanel?.classList.add("hidden");
    if (memoryPanels) memoryPanels.classList.remove("active");
    this.setPanelState(false);
  }

  setPanelState(isSettingsOpen) {
    if (!memoryOverlay) return;
    memoryOverlay.classList.toggle("memory-modal-open", isSettingsOpen);
    if (isSettingsOpen) {
      if (this.state.running && !this.state.paused) {
        this.state.paused = true;
        this.modalPaused = true;
        this.timer.pause();
        this.setMessage("Paused (Settings).");
      }
    } else if (this.modalPaused) {
      this.state.paused = false;
      this.modalPaused = false;
      this.timer.resume();
      this.setMessage("Back to game.");
    }
  }

  setMessage(text) {
    if (memoryMsg) memoryMsg.textContent = text;
  }

  scheduleLayoutFit() {
    if (!memoryGrid) return;
    if (this.layoutFrame) {
      cancelAnimationFrame(this.layoutFrame);
    }
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = requestAnimationFrame(() => {
        this.layoutFrame = null;
        this.fitBoardToViewport();
      });
    });
  }

  fitBoardToViewport() {
    if (!memoryGrid || !memoryBoard) return;

    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const cardRatio = diff.cols === 4 && diff.rows === 3 ? 1.42 : 1;
    memoryGrid.style.setProperty("--memory-card-ratio", String(cardRatio));

    if (!memoryOverlay?.classList.contains("active") || window.matchMedia("(max-width: 1180px)").matches) {
      memoryGrid.style.removeProperty("width");
      return;
    }

    const boardStyles = window.getComputedStyle(memoryBoard);
    const gridStyles = window.getComputedStyle(memoryGrid);
    const availableWidth =
      memoryBoard.clientWidth -
      (parseFloat(boardStyles.paddingLeft) || 0) -
      (parseFloat(boardStyles.paddingRight) || 0);
    const availableHeight =
      memoryBoard.clientHeight -
      (parseFloat(boardStyles.paddingTop) || 0) -
      (parseFloat(boardStyles.paddingBottom) || 0);

    if (availableWidth <= 0 || availableHeight <= 0) {
      memoryGrid.style.removeProperty("width");
      return;
    }

    const columnGap = parseFloat(gridStyles.columnGap) || 0;
    const rowGap = parseFloat(gridStyles.rowGap) || columnGap;
    const maxCardWidth = (availableWidth - columnGap * (diff.cols - 1)) / diff.cols;
    const maxCardHeight = (availableHeight - rowGap * (diff.rows - 1)) / diff.rows;
    const fittedCardWidth = Math.min(maxCardWidth, maxCardHeight * cardRatio);

    if (!Number.isFinite(fittedCardWidth) || fittedCardWidth <= 0) {
      memoryGrid.style.removeProperty("width");
      return;
    }

    const fittedWidth = fittedCardWidth * diff.cols + columnGap * (diff.cols - 1);
    memoryGrid.style.width = `${Math.max(0, Math.min(availableWidth, fittedWidth))}px`;
  }

  buildBoard() {
    if (!memoryGrid) return;
    memoryGrid.innerHTML = "";
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    memoryGrid.style.setProperty("--mm-cols", String(diff.cols));
    memoryGrid.style.setProperty("--mm-rows", String(diff.rows));
    memoryGrid.style.setProperty("--flip-speed", `${MEMORY_SPEED[this.settings.speed] || 350}ms`);
    memoryGrid.style.aspectRatio = "auto";
    memoryGrid.style.removeProperty("width");
    memoryGrid.style.setProperty("--memory-card-ratio", diff.cols === 4 && diff.rows === 3 ? "1.42" : "1");

    const values = this.buildValues(diff.pairs);
    const deck = [];
    values.forEach((value, id) => {
      deck.push({ id, value });
      deck.push({ id, value });
    });
    shuffle(deck);
    this.cards = deck.map((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.index = String(index);
      button.dataset.id = String(card.id);
      button.dataset.value = String(card.value);
      button.setAttribute("aria-label", "Hidden memory card");
      button.innerHTML = `
        <span class="memory-card-inner">
          <span class="memory-card-face memory-card-back" data-value="${card.value}"></span>
          <span class="memory-card-face memory-card-front">
            <span class="memory-icon">${card.value}</span>
          </span>
        </span>
      `;
      this.setCardFace(button, false);
      button.addEventListener("click", () => this.handleCard(button));
      memoryGrid.appendChild(button);
      return { ...card, element: button, matched: false };
    });

    this.state.focusIndex = 0;
    this.scheduleLayoutFit();
  }

  buildValues(pairs) {
    const pool = MEMORY_THEMES[this.settings.theme] || MEMORY_THEMES.animals;
    const values = [];
    let idx = 0;
    while (values.length < pairs) {
      values.push(pool[idx % pool.length]);
      idx += 1;
    }
    return values;
  }

  startGame() {
    this.state = {
      running: true,
      paused: false,
      lock: false,
      first: null,
      second: null,
      moves: 0,
      matches: 0,
      score: 0,
      combo: 0,
      bestStreak: 0,
      hintsLeft: 3,
      focusIndex: 0,
    };
    this.buildBoard();
    this.updateHud();
    this.setMessage("Match all pairs.");
    this.hidePanels();
    this.hideResult();
    memoryOverlay?.classList.add("memory-playing");
    memorySessionActive = true;
    recordGameHistory({
      game: "Memory Match",
      action: "Started",
      details: `Difficulty: ${this.settings.difficulty} | Mode: ${this.settings.mode} | Theme: ${this.settings.theme}`,
    });

    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const useCountdown = this.settings.mode === "time-attack" && diff.timeLimit > 0;
    const startSeconds = useCountdown ? diff.timeLimit : 0;
    this.timer.start(startSeconds, useCountdown);
    this.scheduleLayoutFit();
  }

  pauseGame(force = false) {
    if (!this.state.running) return;
    this.state.paused = force ? true : !this.state.paused;
    if (this.state.paused) {
      this.timer.pause();
      this.setMessage("Paused.");
    } else {
      this.timer.resume();
      this.setMessage("Back to game.");
    }
  }

  togglePause() {
    this.pauseGame();
  }

  updateTime(value) {
    if (!memoryTimeEl) return;
    memoryTimeEl.textContent = formatTime(value);
  }

  timeUp() {
    this.state.running = false;
    this.setMessage("Time is up!");
    this.finishGame(false);
  }

  handleCard(cardEl) {
    if (!this.state.running || this.state.paused) return;
    if (this.state.lock) return;
    if (cardEl.classList.contains("matched") || cardEl === this.state.first) return;

    cardEl.classList.add("flipped");
    this.setCardFace(cardEl, true);
    cardEl.setAttribute("aria-label", `Card ${cardEl.dataset.value}`);
    this.audio.play(520, 0.1, "square");

    if (!this.state.first) {
      this.state.first = cardEl;
      return;
    }

    this.state.second = cardEl;
    this.state.lock = true;
    this.state.moves += 1;

    const match = this.state.first.dataset.id === this.state.second.dataset.id;
    if (match) {
      this.handleMatch();
    } else {
      this.handleMismatch();
    }
    this.updateHud();
  }

  handleMatch() {
    const basePoints = 100;
    const nextCombo = Math.min(4, this.state.combo + 1);
    const multiplier = Math.max(1, nextCombo);
    this.state.score += basePoints * multiplier;
    this.state.combo = nextCombo;
    this.state.bestStreak = Math.max(this.state.bestStreak, this.state.combo);
    this.state.matches += 1;

    this.state.first.classList.add("matched");
    this.state.second.classList.add("matched");
    this.state.first.setAttribute("aria-label", `Matched card ${this.state.first.dataset.value}`);
    this.state.second.setAttribute("aria-label", `Matched card ${this.state.second.dataset.value}`);
    this.audio.play(780, 0.12, "triangle");

    this.resetTurn();

    if (this.state.matches >= MEMORY_DIFFICULTY[this.settings.difficulty].pairs) {
      this.finishGame(true);
    }
  }

  handleMismatch() {
    this.state.combo = 0;
    this.state.first.classList.add("wrong");
    this.state.second.classList.add("wrong");
    this.audio.play(180, 0.15, "sawtooth");

    setTimeout(() => {
      this.state.first.classList.remove("flipped", "wrong");
      this.state.second.classList.remove("flipped", "wrong");
      this.setCardFace(this.state.first, false);
      this.setCardFace(this.state.second, false);
      this.state.first.setAttribute("aria-label", "Hidden memory card");
      this.state.second.setAttribute("aria-label", "Hidden memory card");
      this.resetTurn();
    }, 1000);
  }

  resetTurn() {
    this.state.first = null;
    this.state.second = null;
    this.state.lock = false;
  }

  useHint() {
    if (!this.state.running || this.state.paused) return;
    if (this.state.hintsLeft <= 0) return;

    const unmatched = this.cards.filter((card) => !card.element.classList.contains("matched"));
    const map = new Map();
    for (const card of unmatched) {
      const list = map.get(card.id) || [];
      list.push(card);
      map.set(card.id, list);
    }
    const pair = Array.from(map.values()).find((list) => list.length >= 2);
    if (!pair) return;

    pair[0].element.classList.add("flipped");
    pair[1].element.classList.add("flipped");
    setTimeout(() => {
      if (!pair[0].element.classList.contains("matched")) pair[0].element.classList.remove("flipped");
      if (!pair[1].element.classList.contains("matched")) pair[1].element.classList.remove("flipped");
    }, 700);

    this.state.hintsLeft -= 1;
    this.updateHintButton();
  }

  updateHintButton() {
    if (!memoryHintBtn) return;
    if (memoryHintCount) {
      memoryHintCount.textContent = String(this.state.hintsLeft);
    } else {
      memoryHintBtn.textContent = `Hint (${this.state.hintsLeft})`;
    }
    memoryHintBtn.disabled = this.state.hintsLeft <= 0;
    memoryHintBtn.classList.toggle("is-empty", this.state.hintsLeft <= 0);
  }

  finishGame(win) {
    this.state.running = false;
    this.timer.stop();
    memoryOverlay?.classList.remove("memory-playing");
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const timeUsed = this.timer.countdown
      ? Math.max(0, diff.timeLimit - this.timer.remaining)
      : this.timer.elapsed;

    if (win) {
      this.setMessage("");
      this.updateBestMoves();
      this.updateStats(true);
      this.updateLeaderboard();
      memoryGrid?.classList.add("victory");
      setTimeout(() => memoryGrid?.classList.remove("victory"), 1200);
    } else {
      this.setMessage("");
      this.updateStats(false);
    }
    if (memorySessionActive) {
      recordGameHistory({
        game: "Memory Match",
        action: win ? "Completed" : "Time Up",
        details: `Score: ${this.state.score} | Moves: ${this.state.moves} | Time: ${formatTime(timeUsed)} | Difficulty: ${this.settings.difficulty}`,
      });
      memorySessionActive = false;
    }
    this.showResult(win);
  }

  showResult(win) {
    if (!memoryResult) return;
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const timeUsed = this.timer.countdown
      ? Math.max(0, diff.timeLimit - this.timer.remaining)
      : this.timer.elapsed;
    if (memoryResultTitle) {
      memoryResultTitle.textContent = win ? "You Win!" : "Time Up!";
    }
    if (memoryResultScore) memoryResultScore.textContent = String(this.state.score);
    if (memoryResultMoves) memoryResultMoves.textContent = String(this.state.moves);
    if (memoryResultTime) memoryResultTime.textContent = formatTime(timeUsed);
    if (memoryResultCombo) memoryResultCombo.textContent = `x${Math.max(1, this.state.bestStreak)}`;
    memoryResult.classList.remove("hidden");
    memoryResult.setAttribute("aria-hidden", "false");
  }

  hideResult() {
    if (!memoryResult) return;
    memoryResult.classList.add("hidden");
    memoryResult.setAttribute("aria-hidden", "true");
  }

  updateBestMoves() {
    const key = this.settings.difficulty;
    let best = null;
    try {
      const raw = localStorage.getItem(MEMORY_BEST_MOVES_KEY);
      best = raw ? JSON.parse(raw) : {};
    } catch (error) {
      best = {};
    }
    const current = best[key];
    if (!current || this.state.moves < current) {
      best[key] = this.state.moves;
      try {
        localStorage.setItem(MEMORY_BEST_MOVES_KEY, JSON.stringify(best));
      } catch (error) {
        // ignore
      }
    }
  }

  getBestMoves() {
    try {
      const raw = localStorage.getItem(MEMORY_BEST_MOVES_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data[this.settings.difficulty] || "--";
    } catch (error) {
      return "--";
    }
  }

  updateStats(win) {
    const stats = this.loadStats();
    stats.games += 1;
    if (win) stats.wins += 1;
    stats.totalMatches += this.state.matches;
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const timeUsed = this.timer.countdown ? diff.timeLimit - this.timer.remaining : this.timer.elapsed;
    stats.totalTime += timeUsed;
    stats.totalPlayTime += timeUsed;
    stats.bestScore[this.settings.difficulty] = Math.max(stats.bestScore[this.settings.difficulty] || 0, this.state.score);
    this.saveStats(stats);
    this.renderStats();
  }

  loadStats() {
    try {
      const raw = localStorage.getItem(MEMORY_STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      // ignore
    }
    return {
      games: 0,
      wins: 0,
      totalTime: 0,
      totalMatches: 0,
      totalPlayTime: 0,
      bestScore: { easy: 0, medium: 0, hard: 0 },
    };
  }

  saveStats(stats) {
    try {
      localStorage.setItem(MEMORY_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      // ignore
    }
  }

  renderStats() {
    const stats = this.loadStats();
    const winRate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
    const avgTime = stats.games ? Math.round(stats.totalTime / stats.games) : 0;
    if (memoryStatGames) memoryStatGames.textContent = String(stats.games);
    if (memoryStatWinrate) memoryStatWinrate.textContent = `${winRate}%`;
    if (memoryStatAvgTime) memoryStatAvgTime.textContent = formatTime(avgTime);
    if (memoryStatMatches) memoryStatMatches.textContent = String(stats.totalMatches);
    if (memoryStatBestEasy) memoryStatBestEasy.textContent = String(stats.bestScore.easy || 0);
    if (memoryStatBestMedium) memoryStatBestMedium.textContent = String(stats.bestScore.medium || 0);
    if (memoryStatBestHard) memoryStatBestHard.textContent = String(stats.bestScore.hard || 0);
    if (memoryStatTotalTime) memoryStatTotalTime.textContent = formatTime(stats.totalPlayTime || 0);
  }

  updateLeaderboard() {
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    const timeUsed = this.timer.countdown ? Math.max(0, diff.timeLimit - this.timer.remaining) : this.timer.elapsed;
    const entry = {
      player: this.settings.player,
      score: this.state.score,
      moves: this.state.moves,
      time: timeUsed,
      date: new Date().toLocaleDateString(),
      difficulty: this.settings.difficulty,
    };
    this.leaderboard.add(entry);
    this.renderLeaderboard();
  }

  renderLeaderboard() {
    if (!memoryLeaderboardBody || !memoryLeaderboardFilter) return;
    const difficulty = memoryLeaderboardFilter.value || this.settings.difficulty;
    const list = this.leaderboard.get(difficulty);
    memoryLeaderboardBody.innerHTML = "";
    if (!list.length) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="6">No scores yet.</td>';
      memoryLeaderboardBody.appendChild(row);
      return;
    }
    list.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.player}</td>
        <td>${entry.score}</td>
        <td>${entry.moves}</td>
        <td>${formatTime(entry.time)}</td>
        <td>${entry.date}</td>
      `;
      memoryLeaderboardBody.appendChild(row);
    });
  }

  getThemeLabel() {
    const labels = {
      animals: "ANIMALS",
      emoji: "EMOJI",
      numbers: "NUMBERS",
      space: "GALAXY",
      food: "FOOD",
    };
    return labels[this.settings.theme] || "GALAXY";
  }

  toggleSound() {
    this.settings.sound = !this.settings.sound;
    this.audio.enabled = this.settings.sound;
    if (memorySettingSound) memorySettingSound.checked = this.settings.sound;
    this.saveSettings();
    this.updateHud();
  }

  updateHud() {
    if (memoryDifficultyEl) memoryDifficultyEl.textContent = MEMORY_DIFFICULTY[this.settings.difficulty].label;
    if (memoryModeEl) memoryModeEl.textContent = MEMORY_MODES[this.settings.mode];
    if (memoryScoreEl) memoryScoreEl.textContent = String(this.state.score);
    if (memoryMovesEl) memoryMovesEl.textContent = String(this.state.moves);
    if (memoryComboEl) memoryComboEl.textContent = `x${Math.max(1, this.state.combo)}`;
    if (memoryBestStreakEl) memoryBestStreakEl.textContent = String(this.state.bestStreak);
    const efficiency = this.state.moves ? this.state.matches / this.state.moves : 0;
    if (memoryEfficiencyEl) memoryEfficiencyEl.textContent = efficiency.toFixed(2);
    if (memoryBestMovesEl) memoryBestMovesEl.textContent = String(this.getBestMoves());
    if (memoryPlayerEl) memoryPlayerEl.textContent = this.settings.player;
    const totalPairs = MEMORY_DIFFICULTY[this.settings.difficulty].pairs;
    if (memoryProgressSummary) memoryProgressSummary.textContent = `${this.state.matches} / ${totalPairs} PAIRS`;
    if (memoryProgressFill) {
      const percent = totalPairs ? (this.state.matches / totalPairs) * 100 : 0;
      memoryProgressFill.style.width = `${percent}%`;
    }
    if (memoryThemeName) memoryThemeName.textContent = this.getThemeLabel();
    if (memoryThemePreview) memoryThemePreview.dataset.theme = this.settings.theme;
    if (memorySoundState) memorySoundState.textContent = this.settings.sound ? "ON" : "OFF";
    if (memorySoundToggle) memorySoundToggle.setAttribute("aria-pressed", this.settings.sound ? "true" : "false");
    this.updateHintButton();
  }

  moveFocus(code) {
    if (!this.cards.length) return;
    const diff = MEMORY_DIFFICULTY[this.settings.difficulty];
    let index = this.state.focusIndex;
    const active = document.activeElement;
    if (active && active.classList.contains("memory-card")) {
      index = Number(active.dataset.index);
    }
    let row = Math.floor(index / diff.cols);
    let col = index % diff.cols;
    if (code === "ArrowLeft") col = (col - 1 + diff.cols) % diff.cols;
    if (code === "ArrowRight") col = (col + 1) % diff.cols;
    if (code === "ArrowUp") row = (row - 1 + diff.rows) % diff.rows;
    if (code === "ArrowDown") row = (row + 1) % diff.rows;
    const nextIndex = row * diff.cols + col;
    const nextCard = this.cards[nextIndex];
    if (nextCard?.element) {
      nextCard.element.focus();
      this.state.focusIndex = nextIndex;
    }
  }

  shareScore() {
    const text = `Memory Match score: ${this.state.score}`;
    if (navigator.share) {
      navigator.share({ title: "Memory Match", text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      this.setMessage("Score copied to clipboard.");
    }
  }
}

memoryGame = new MemoryMatch();
memoryGame.init();


// ---------------- Pixel Puzzle ----------------
const puzzleGrid = document.getElementById("puzzle-grid");
const puzzleMsg = document.getElementById("puzzle-msg");
const puzzleShuffleBtn = document.getElementById("puzzle-shuffle");
const puzzleHintBtn = document.getElementById("puzzle-hint");
const puzzlePrevBtn = document.getElementById("puzzle-prev");
const puzzleNextBtn = document.getElementById("puzzle-next");
const puzzleAutoBtn = document.getElementById("puzzle-auto");
const puzzleImageSelect = document.getElementById("puzzle-image-select");
const puzzleMovesEl = document.getElementById("puzzle-moves");
const puzzleTimeEl = document.getElementById("puzzle-time");
const puzzleImageNameEl = document.getElementById("puzzle-image-name");
const puzzleStatusEl = document.getElementById("puzzle-status");
const puzzlePreviewImage = document.getElementById("puzzle-preview-image");
const puzzleResult = document.getElementById("puzzle-result");
const puzzleResultMoves = document.getElementById("puzzle-result-moves");
const puzzleResultTime = document.getElementById("puzzle-result-time");
const puzzleResultImage = document.getElementById("puzzle-result-image");
const puzzleResultNext = document.getElementById("puzzle-result-next");
const puzzleResultRestart = document.getElementById("puzzle-result-restart");
const puzzleAutoLabel = document.querySelector("[data-puzzle-auto-label]");

const PUZZLE_SIZE = 4;
const PUZZLE_TILE_COUNT = PUZZLE_SIZE * PUZZLE_SIZE;
const PUZZLE_EMPTY_TILE = PUZZLE_TILE_COUNT - 1;
const PUZZLE_CANDIDATES = Array.from(
  { length: 30 },
  (_, i) => `../assets/pixelimg/pixel_puzzleimg/${i + 1}.jpg`
);

let puzzleImages = [];
let puzzleImagesReady = false;
let puzzleImagesLoading = null;
let puzzleImageIndex = 0;
let puzzleOrder = Array.from({ length: PUZZLE_TILE_COUNT }, (_, i) => i);
let hintOn = false;
let puzzleMoves = 0;
let puzzleElapsed = 0;
let puzzleTimerId = null;
let puzzleSolved = false;
let puzzleAutoRotate = true;
let puzzleAwarded = false;

function loadPuzzleImages() {
  if (puzzleImagesReady) return Promise.resolve();
  if (puzzleImagesLoading) return puzzleImagesLoading;

  puzzleImagesLoading = Promise.all(
    PUZZLE_CANDIDATES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = () => resolve(null);
          img.src = src;
        })
    )
  ).then((results) => {
    puzzleImages = results.filter(Boolean);
    if (!puzzleImages.length) {
      puzzleImages = [PUZZLE_CANDIDATES[0]];
    }
    puzzleImagesReady = true;
    updatePuzzleImageSelect();
  });

  return puzzleImagesLoading;
}

function updatePuzzleImageSelect() {
  if (!puzzleImageSelect) return;
  puzzleImageSelect.innerHTML = "";
  puzzleImages.forEach((src, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = src.split("/").pop() || `Image ${index + 1}`;
    puzzleImageSelect.appendChild(option);
  });
  puzzleImageSelect.value = String(puzzleImageIndex);
}

function setPuzzleMessage(message) {
  if (puzzleMsg) puzzleMsg.textContent = message;
}

function setPuzzleStatus(text) {
  if (!puzzleStatusEl) return;
  puzzleStatusEl.textContent = text.toUpperCase();
  puzzleStatusEl.dataset.state = text.toLowerCase().replace(/\s+/g, "-");
}

function updatePuzzlePreview() {
  if (!puzzlePreviewImage || !puzzleImages.length) return;
  const src = puzzleImages[puzzleImageIndex];
  const name = src.split("/").pop() || "Puzzle image";
  puzzlePreviewImage.src = src;
  puzzlePreviewImage.alt = `Preview of ${name}`;
}

function setPuzzleImage(index, shuffleAfter = true) {
  if (!puzzleImages.length) return;
  const clamped = (index + puzzleImages.length) % puzzleImages.length;
  puzzleImageIndex = clamped;
  const imageName = puzzleImages[puzzleImageIndex].split("/").pop() || "Image";
  if (puzzleImageNameEl) {
    puzzleImageNameEl.textContent = imageName;
  }
  if (puzzleImageSelect) puzzleImageSelect.value = String(puzzleImageIndex);
  updatePuzzlePreview();
  if (shuffleAfter) {
    shufflePuzzle();
    return;
  }
  renderPuzzle();
}

function formatPuzzleTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.floor(totalSeconds % 60));
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startPuzzleTimer() {
  if (puzzleTimerId) return;
  puzzleTimerId = setInterval(() => {
    puzzleElapsed += 1;
    updatePuzzleHud();
  }, 1000);
}

function stopPuzzleTimer() {
  if (puzzleTimerId) {
    clearInterval(puzzleTimerId);
    puzzleTimerId = null;
  }
}

function getSolvedPuzzleOrder() {
  return Array.from({ length: PUZZLE_TILE_COUNT }, (_, i) => i);
}

function getPuzzleNeighbors(position) {
  const row = Math.floor(position / PUZZLE_SIZE);
  const col = position % PUZZLE_SIZE;
  const neighbors = [];
  if (row > 0) neighbors.push(position - PUZZLE_SIZE);
  if (row < PUZZLE_SIZE - 1) neighbors.push(position + PUZZLE_SIZE);
  if (col > 0) neighbors.push(position - 1);
  if (col < PUZZLE_SIZE - 1) neighbors.push(position + 1);
  return neighbors;
}

function getPuzzleEmptyPosition() {
  return puzzleOrder.indexOf(PUZZLE_EMPTY_TILE);
}

function isPuzzleSolved() {
  return puzzleOrder.every((value, index) => value === index);
}

function buildShuffledPuzzleOrder(steps = 220) {
  const order = getSolvedPuzzleOrder();
  let emptyPos = PUZZLE_EMPTY_TILE;
  let previousEmptyPos = -1;

  for (let i = 0; i < steps; i += 1) {
    let choices = getPuzzleNeighbors(emptyPos).filter((pos) => pos !== previousEmptyPos);
    if (!choices.length) choices = getPuzzleNeighbors(emptyPos);
    const targetPos = choices[Math.floor(Math.random() * choices.length)];
    [order[emptyPos], order[targetPos]] = [order[targetPos], order[emptyPos]];
    previousEmptyPos = emptyPos;
    emptyPos = targetPos;
  }

  if (order.every((value, index) => value === index)) {
    return buildShuffledPuzzleOrder(steps + 20);
  }
  return order;
}

function updatePuzzleAutoButton() {
  if (puzzleAutoBtn) {
    puzzleAutoBtn.classList.toggle("is-on", puzzleAutoRotate);
  }
  if (puzzleAutoLabel) {
    puzzleAutoLabel.textContent = puzzleAutoRotate ? "AUTO: ON" : "AUTO: OFF";
  } else if (puzzleAutoBtn) {
    puzzleAutoBtn.textContent = puzzleAutoRotate ? "AUTO: ON" : "AUTO: OFF";
  }
}

function resetPuzzle() {
  loadPuzzleImages().then(() => {
    puzzleOrder = getSolvedPuzzleOrder();
    hintOn = false;
    puzzleMoves = 0;
    puzzleElapsed = 0;
    puzzleSolved = false;
    puzzleAwarded = false;
    puzzleGrid?.classList.remove("show-hint");
    puzzleHintBtn?.classList.remove("is-active");
    setPuzzleMessage("");
    stopPuzzleTimer();
    hidePuzzleResult();
    updatePuzzleAutoButton();
    setPuzzleImage(puzzleImageIndex, true);
    updatePuzzleHud();
  });
}

function updatePuzzleHud() {
  if (puzzleMovesEl) puzzleMovesEl.textContent = String(puzzleMoves);
  if (puzzleTimeEl) puzzleTimeEl.textContent = formatPuzzleTime(puzzleElapsed);
}

function renderPuzzle() {
  if (!puzzleGrid) return;
  puzzleGrid.style.setProperty("--puzzle-size", String(PUZZLE_SIZE));
  puzzleGrid.innerHTML = "";
  const imageSrc = puzzleImages[puzzleImageIndex];
  const emptyPos = getPuzzleEmptyPosition();
  puzzleOrder.forEach((value, pos) => {
    const piece = document.createElement("button");
    piece.type = "button";
    const isEmpty = value === PUZZLE_EMPTY_TILE;
    const isMovable = !isEmpty && getPuzzleNeighbors(emptyPos).includes(pos);
    piece.className = `puzzle-piece${isEmpty ? " empty" : ""}${isMovable ? " is-movable" : ""}`;
    piece.dataset.pos = String(pos);
    piece.dataset.index = isEmpty ? "" : String(value + 1);

    if (isEmpty) {
      piece.disabled = true;
      piece.setAttribute("aria-label", "Empty slot");
    } else {
      const row = Math.floor(value / PUZZLE_SIZE);
      const col = value % PUZZLE_SIZE;
      const posX = (col / (PUZZLE_SIZE - 1)) * 100;
      const posY = (row / (PUZZLE_SIZE - 1)) * 100;
      piece.style.backgroundImage = `url('${imageSrc}')`;
      piece.style.backgroundSize = `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`;
      piece.style.backgroundPosition = `${posX}% ${posY}%`;
      piece.setAttribute(
        "aria-label",
        isMovable ? `Puzzle tile ${value + 1}, movable` : `Puzzle tile ${value + 1}`
      );
    }

    piece.addEventListener("click", handlePuzzleClick);
    puzzleGrid.appendChild(piece);
  });
}

function handlePuzzleClick(e) {
  if (puzzleSolved) return;
  const pos = Number(e.currentTarget.dataset.pos);
  const emptyPos = getPuzzleEmptyPosition();
  if (puzzleOrder[pos] === PUZZLE_EMPTY_TILE) return;
  if (!getPuzzleNeighbors(emptyPos).includes(pos)) {
    setPuzzleMessage("Move a neighboring tile.");
    return;
  }

  if (!puzzleTimerId) startPuzzleTimer();
  [puzzleOrder[emptyPos], puzzleOrder[pos]] = [puzzleOrder[pos], puzzleOrder[emptyPos]];
  puzzleMoves += 1;
  setPuzzleMessage("");
  setPuzzleStatus("In Progress");
  renderPuzzle();
  checkPuzzleSolved();
}

function checkPuzzleSolved() {
  const solved = isPuzzleSolved();
  puzzleSolved = solved;
  if (!solved) {
    updatePuzzleHud();
    return;
  }
  stopPuzzleTimer();
  setPuzzleStatus("Solved");
  setPuzzleMessage("Puzzle solved!");
  if (!puzzleAwarded) {
    addProfileMark(PUZZLE_TILE_COUNT - 1);
    puzzleAwarded = true;
  }
  if (puzzleSessionActive) {
    const imageName = puzzleImages[puzzleImageIndex]?.split("/").pop() || "Puzzle";
    recordGameHistory({
      game: "Pixel Puzzle",
      action: "Completed",
      details: `Image: ${imageName} | Moves: ${puzzleMoves} | Time: ${formatPuzzleTime(puzzleElapsed)}`,
    });
    puzzleSessionActive = false;
  }
  showPuzzleResult();
  if (puzzleAutoRotate) {
    setTimeout(() => {
      nextPuzzleImage();
    }, 1200);
  }
}

function shufflePuzzle() {
  if (!puzzleImagesReady) return;
  puzzleOrder = buildShuffledPuzzleOrder();
  puzzleSolved = false;
  hintOn = false;
  puzzleMoves = 0;
  puzzleElapsed = 0;
  stopPuzzleTimer();
  puzzleGrid?.classList.remove("show-hint");
  puzzleHintBtn?.classList.remove("is-active");
  setPuzzleMessage("");
  setPuzzleStatus("Shuffled");
  updatePuzzleHud();
  hidePuzzleResult();
  renderPuzzle();
  puzzleSessionActive = true;
  recordGameHistory({
    game: "Pixel Puzzle",
    action: "Started",
    details: `Image: ${puzzleImages[puzzleImageIndex]?.split("/").pop() || "Puzzle"}`,
  });
}

function toggleHint() {
  hintOn = !hintOn;
  puzzleGrid?.classList.toggle("show-hint", hintOn);
  puzzleHintBtn?.classList.toggle("is-active", hintOn);
  setPuzzleMessage(hintOn ? "Hint on." : "Hint off.");
}

function showPuzzleResult() {
  if (!puzzleResult) return;
  if (puzzleResultMoves) puzzleResultMoves.textContent = String(puzzleMoves);
  if (puzzleResultTime) puzzleResultTime.textContent = formatPuzzleTime(puzzleElapsed);
  if (puzzleResultImage) {
    puzzleResultImage.textContent = puzzleImages[puzzleImageIndex]?.split("/").pop() || "Image";
  }
  puzzleResult.classList.remove("hidden");
  puzzleResult.setAttribute("aria-hidden", "false");
}

function hidePuzzleResult() {
  if (!puzzleResult) return;
  puzzleResult.classList.add("hidden");
  puzzleResult.setAttribute("aria-hidden", "true");
}

function nextPuzzleImage() {
  setPuzzleImage(puzzleImageIndex + 1, true);
}

function prevPuzzleImage() {
  setPuzzleImage(puzzleImageIndex - 1, true);
}

function toggleAutoRotate() {
  puzzleAutoRotate = !puzzleAutoRotate;
  updatePuzzleAutoButton();
  setPuzzleMessage(puzzleAutoRotate ? "Auto rotate on." : "Auto rotate off.");
}

puzzleShuffleBtn?.addEventListener("click", shufflePuzzle);
puzzleHintBtn?.addEventListener("click", toggleHint);
puzzlePrevBtn?.addEventListener("click", prevPuzzleImage);
puzzleNextBtn?.addEventListener("click", nextPuzzleImage);
puzzleAutoBtn?.addEventListener("click", toggleAutoRotate);
puzzleResultNext?.addEventListener("click", nextPuzzleImage);
puzzleResultRestart?.addEventListener("click", shufflePuzzle);
puzzleImageSelect?.addEventListener("change", (e) => {
  const index = Number(e.target.value || 0);
  setPuzzleImage(index, true);
});

resetPuzzle();

// ---------------- Tic Tac Toe ----------------
const tttGrid = document.getElementById("ttt-grid");
const tttMsg = document.getElementById("ttt-msg");
const tttResetBtn = document.getElementById("ttt-reset");
const tttStartBtn = document.getElementById("ttt-start");
const tttModePanel = document.getElementById("ttt-mode-panel");
const tttModeFriendBtn = document.getElementById("ttt-mode-friend");
const tttModeComputerBtn = document.getElementById("ttt-mode-computer");
const tttModeLabel = document.getElementById("ttt-mode-label");
const tttTurnLabel = document.getElementById("ttt-turn-label");
const tttScoreX = document.getElementById("ttt-score-x");
const tttScoreO = document.getElementById("ttt-score-o");
const tttScoreXLabel = document.getElementById("ttt-score-x-label");
const tttScoreOLabel = document.getElementById("ttt-score-o-label");
const tttTurnBanner = document.getElementById("ttt-turn");
const tttChangeModeBtn = document.getElementById("ttt-change-mode");
const tttLegendXLabel = document.getElementById("ttt-legend-x-label");
const tttLegendOLabel = document.getElementById("ttt-legend-o-label");

const TTT_WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const TTT_DEFAULT_MODE = "friend";

let tttBoard = Array(9).fill("");
let tttPlayer = "X";
let tttOver = false;
let tttLocked = false;
let tttMode = null;
let tttScores = { X: 0, O: 0 };
let tttWinningCombo = [];
let tttAwarded = false;

function getTttMarkIcon(mark) {
  if (mark === "X") {
    return `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path d="M14 14 34 34M34 14 14 34" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="5"></path>
      </svg>
    `;
  }

  if (mark === "O") {
    return `
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="5"></circle>
      </svg>
    `;
  }

  return "";
}

function setTttMessage(message) {
  if (tttMsg) tttMsg.textContent = message;
}

function setBoardDisabled(disabled) {
  if (!tttGrid) return;
  tttGrid.classList.toggle("disabled", disabled);
  tttGrid.setAttribute("aria-disabled", String(disabled));
}

function isModePanelOpen() {
  return Boolean(tttModePanel && !tttModePanel.classList.contains("hidden"));
}

function hideModePanel() {
  if (tttModePanel) tttModePanel.classList.add("hidden");
}

function setTttTurnBanner(markup, { state = "turn", mark = "" } = {}) {
  if (!tttTurnBanner) return;
  tttTurnBanner.innerHTML = markup;
  tttTurnBanner.dataset.state = state;

  if (mark) {
    tttTurnBanner.dataset.mark = mark;
  } else {
    tttTurnBanner.removeAttribute("data-mark");
  }
}

function updateModeLabels() {
  if (tttModeLabel) {
    tttModeLabel.textContent = tttMode === "computer" ? "COMPUTER" : tttMode === "friend" ? "FRIEND" : "--";
  }
}

function updateScoreLabels() {
  const xLabel = "YOU (X)";
  const oLabel = tttMode === "computer" ? "COMPUTER (O)" : "FRIEND (O)";

  if (tttScoreXLabel) {
    tttScoreXLabel.textContent = xLabel;
  }
  if (tttScoreOLabel) {
    tttScoreOLabel.textContent = oLabel;
  }
  if (tttLegendXLabel) {
    tttLegendXLabel.textContent = xLabel;
  }
  if (tttLegendOLabel) {
    tttLegendOLabel.textContent = oLabel;
  }
}

function updateScores() {
  if (tttScoreX) tttScoreX.textContent = String(tttScores.X);
  if (tttScoreO) tttScoreO.textContent = String(tttScores.O);
}

function updateModeButtons() {
  tttModeFriendBtn?.classList.toggle("active", tttMode === "friend");
  tttModeComputerBtn?.classList.toggle("active", tttMode === "computer");
}

function syncTttModeUi() {
  tttOverlay?.classList.toggle("ttt-mode-friend", tttMode === "friend");
  tttOverlay?.classList.toggle("ttt-mode-computer", tttMode === "computer");
  updateModeLabels();
  updateScoreLabels();
  updateModeButtons();
}

function updateTurnDisplay() {
  if (!tttTurnBanner || !tttTurnLabel) return;

  if (!tttMode) {
    setTttTurnBanner("SELECT <span>MODE</span>", { state: "waiting" });
    tttTurnLabel.textContent = "--";
    return;
  }

  if (tttOver) {
    const winner = tttWinningCombo.length ? tttPlayer : "";
    setTttTurnBanner(`<span>${(tttMsg?.textContent || "ROUND FINISHED").toUpperCase()}</span>`, {
      state: "status",
      mark: winner,
    });
    tttTurnLabel.textContent = winner || "--";
    return;
  }

  if (tttMode === "friend") {
    setTttTurnBanner(`PLAYER <span>${tttPlayer}'S</span> TURN`, { mark: tttPlayer });
  } else {
    const bannerText = tttPlayer === "X"
      ? `PLAYER <span>${tttPlayer}'S</span> TURN`
      : "COMPUTER <span>O'S</span> TURN";
    setTttTurnBanner(bannerText, { mark: tttPlayer });
  }

  tttTurnLabel.textContent = tttPlayer;
}

function drawTtt() {
  if (!tttGrid) return;
  tttGrid.innerHTML = "";
  const winningSet = new Set(tttWinningCombo);
  const lockAll =
    !tttMode ||
    tttOver ||
    tttLocked ||
    isModePanelOpen() ||
    (tttMode === "computer" && tttPlayer === "O");

  tttBoard.forEach((value, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const markClass = value ? ` ${value.toLowerCase()}` : "";
    const winClass = winningSet.has(index) ? " win" : "";
    btn.className = `ttt-cell${markClass}${winClass}`;
    btn.innerHTML = value ? getTttMarkIcon(value) : "";
    btn.disabled = lockAll || Boolean(value);
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    const status = value ? `occupied by ${value}` : "empty";
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Row ${row} column ${col}, ${status}`);
    btn.addEventListener("click", () => handleTttClick(index));
    tttGrid.appendChild(btn);
  });
  setBoardDisabled(lockAll);
}

function getWinningCombo(player) {
  return TTT_WINS.find((combo) => combo.every((i) => tttBoard[i] === player)) || null;
}

function finishRound(message, winner) {
  tttOver = true;
  if (winner) {
    tttScores[winner] += 1;
    updateScores();
    if (!tttAwarded) {
      addProfileMark(3);
      tttAwarded = true;
    }
  }
  if (tttSessionActive) {
    recordGameHistory({
      game: "Tic Tac Toe",
      action: winner ? "Round Finished" : "Draw",
      details: `Mode: ${tttMode} | Result: ${message}`,
    });
    tttSessionActive = false;
  }
  setTttMessage(message);
  updateTurnDisplay();
  drawTtt();
}

function handleTttClick(index) {
  if (!tttMode) {
    showModePanel();
    return;
  }
  if (tttOver || tttLocked || tttBoard[index]) return;
  if (tttMode === "computer" && tttPlayer === "O") return;

  tttBoard[index] = tttPlayer;
  tttWinningCombo = getWinningCombo(tttPlayer) || [];
  drawTtt();

  if (tttWinningCombo.length) {
    const winText = tttMode === "computer"
      ? tttPlayer === "X"
        ? "You win!"
        : "Computer wins."
      : `Player ${tttPlayer} wins!`;
    finishRound(winText, tttPlayer);
    return;
  }
  if (tttBoard.every((cell) => cell)) {
    finishRound("Draw game.");
    return;
  }
  tttPlayer = tttPlayer === "X" ? "O" : "X";
  updateTurnDisplay();

  if (tttMode === "computer" && tttPlayer === "O") {
    computerMove();
  }
}

function findWinningMove(player) {
  for (let i = 0; i < tttBoard.length; i += 1) {
    if (tttBoard[i]) continue;
    tttBoard[i] = player;
    const win = getWinningCombo(player);
    tttBoard[i] = "";
    if (win) return i;
  }
  return null;
}

function chooseComputerMove() {
  const winMove = findWinningMove("O");
  if (winMove !== null) return winMove;
  const blockMove = findWinningMove("X");
  if (blockMove !== null) return blockMove;
  if (!tttBoard[4]) return 4;
  const corners = [0, 2, 6, 8].filter((i) => !tttBoard[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const sides = [1, 3, 5, 7].filter((i) => !tttBoard[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return tttBoard.findIndex((cell) => !cell);
}

function computerMove() {
  if (tttOver) return;
  tttLocked = true;
  drawTtt();
  updateTurnDisplay();
  setTimeout(() => {
    if (tttOver) {
      tttLocked = false;
      drawTtt();
      return;
    }
    const move = chooseComputerMove();
    if (move !== null && move >= 0) {
      tttBoard[move] = "O";
    }
    tttWinningCombo = getWinningCombo("O") || [];
    drawTtt();

    if (tttWinningCombo.length) {
      finishRound("Computer wins.", "O");
      tttLocked = false;
      return;
    }
    if (tttBoard.every((cell) => cell)) {
      finishRound("Draw game.");
      tttLocked = false;
      return;
    }
    tttPlayer = "X";
    tttLocked = false;
    updateTurnDisplay();
    drawTtt();
  }, 420);
}

function showModePanel() {
  if (!tttMode) tttMode = TTT_DEFAULT_MODE;
  if (tttModePanel) tttModePanel.classList.remove("hidden");
  syncTttModeUi();
  setTttMessage("Select Friend or Computer mode.");
  updateTurnDisplay();
  drawTtt();
}

function startTttRound() {
  if (!tttMode) tttMode = TTT_DEFAULT_MODE;

  tttBoard = Array(9).fill("");
  tttPlayer = "X";
  tttOver = false;
  tttLocked = false;
  tttAwarded = false;
  tttWinningCombo = [];
  hideModePanel();
  syncTttModeUi();
  setTttMessage("Game on! Make your move.");
  updateTurnDisplay();
  drawTtt();
  tttSessionActive = Boolean(tttOverlay?.classList.contains("active"));
  if (tttSessionActive) {
    recordGameHistory({
      game: "Tic Tac Toe",
      action: "Started",
      details: `Mode: ${tttMode}`,
    });
  }
}

function setTttMode(mode) {
  tttMode = mode;
  hideModePanel();
  syncTttModeUi();
  tttScores = { X: 0, O: 0 };
  updateScores();
  startTttRound();
}

function resetTtt({ keepMode = true } = {}) {
  tttScores = { X: 0, O: 0 };
  updateScores();
  tttAwarded = false;
  tttWinningCombo = [];
  if (!keepMode || !tttMode) tttMode = TTT_DEFAULT_MODE;
  hideModePanel();
  syncTttModeUi();
  startTttRound();
}

tttModeFriendBtn?.addEventListener("click", () => setTttMode("friend"));
tttModeComputerBtn?.addEventListener("click", () => setTttMode("computer"));
tttStartBtn?.addEventListener("click", startTttRound);
tttResetBtn?.addEventListener("click", () => resetTtt({ keepMode: true }));
tttChangeModeBtn?.addEventListener("click", showModePanel);

resetTtt();
