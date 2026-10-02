// ========================================
// UI Controller
// ========================================

const ENABLE_AI = true;
const AI_THINK_DELAY = 300;

import { STATES, createInitialState, applyMove, undoMove, canUndo, getStartingMark } from "./engine.js";
import { easyMove, normalMove, hardMove } from "./ai.js";
import { saveScores, loadScores, saveSettings, loadSettings, saveTheme, loadTheme, clearGameState } from "./storage.js";
import { saveGameState } from "./storage.js";

let boardEl, statusEl, xWinsEl, oWinsEl, drawCountEl;
let newRoundBtn, undoBtn, resetBtn, themeToggleBtn;
let opponentSelect, startMarkSelect;
let xMarkLabelEl, oMarkLabelEl;
let nuclearOverlay, nuclearTitle;
let roundAudio;
let bgMusic;
let crazyModeActive = false;
let crazyInterval = null;
let gameState, scores, settings, roundNumber, theme;

export function initApp() {
  boardEl = document.getElementById("board");
  statusEl = document.getElementById("status");
  xWinsEl = document.getElementById("x-wins");
  oWinsEl = document.getElementById("o-wins");
  drawCountEl = document.getElementById("draw-count");
  xMarkLabelEl = document.getElementById("x-mark-label");
  oMarkLabelEl = document.getElementById("o-mark-label");
  roundAudio = document.getElementById("round-audio");
  bgMusic = document.getElementById("bg-music");
  nuclearOverlay = document.getElementById("nuclear-overlay");
  nuclearTitle = document.getElementById("nuclear-title");
  newRoundBtn = document.getElementById("new-round");
  undoBtn = document.getElementById("undo-move");
  resetBtn = document.getElementById("reset-match");
  themeToggleBtn = document.getElementById("theme-toggle");
  opponentSelect = document.getElementById("opponent-select");
  startMarkSelect = document.getElementById("start-mark-select");
  scores = loadScores();
  settings = loadSettings();
  theme = loadTheme();
  roundNumber = 0;
  applyTheme(theme);
  opponentSelect.value = settings.opponent;
  startMarkSelect.value = settings.startMark;
  updatePlayerNames();
  const sm = getStartingMark(settings, roundNumber);
  gameState = createInitialState({ startingMark: sm });
  createBoard();
  renderBoard();
  updateScores();
  updateStatus();
  updateControls();
  bindEvents();
}

export function createBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", "Cell " + i + ", empty");
    cell.dataset.cell = i;
    boardEl.appendChild(cell);
  }
}

function bindEvents() {
  boardEl.addEventListener("click", handleCellClick);
  if (bgMusic) {
    bgMusic.volume = 0.5;
  }
  boardEl.addEventListener("keydown", handleCellKeydown);
  newRoundBtn.addEventListener("click", startNewRound);
  undoBtn.addEventListener("click", handleUndo);
  resetBtn.addEventListener("click", handleResetMatch);
  themeToggleBtn.addEventListener("click", toggleTheme);
  opponentSelect.addEventListener("change", handleOpponentChange);
  startMarkSelect.addEventListener("change", handleStartMarkChange);
}

function handleCellClick(e) {
  if (bgMusic && !bgMusic.dataset.played) {
    bgMusic.dataset.played = "true";
    bgMusic.play().catch(() => {});
  }
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const idx = parseInt(cell.dataset.cell, 10);
  if (isNaN(idx)) return;
  if (gameState.state !== STATES.IN_PROGRESS) return;
  if (gameState.board[idx] !== null) { showInvalidFeedback(idx); return; }
  makeMove(idx);
}

function handleCellKeydown(e) {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const idx = parseInt(cell.dataset.cell, 10);
    if (isNaN(idx)) return;
    if (gameState.state !== STATES.IN_PROGRESS) return;
    if (gameState.board[idx] !== null) { showInvalidFeedback(idx); return; }
    makeMove(idx);
  }
}

function makeMove(index) {
  const result = applyMove(gameState, index);
  if (!result.success) return;
  gameState = result.state;
  saveGameState(gameState);
  renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
  if (gameState.state === STATES.WON) { handleGameWin(); }
  else if (gameState.state === STATES.DRAW) { handleGameDraw(); }
  else if (ENABLE_AI && isAITurn()) {
    disableCellInteractions(true);
    setTimeout(() => {
      const aiCell = getAIMove();
      if (aiCell >= 0) {
        const aiR = applyMove(gameState, aiCell);
        if (aiR.success) {
          gameState = aiR.state;
          saveGameState(gameState);
          renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
          if (gameState.state === STATES.WON) handleGameWin();
          else if (gameState.state === STATES.DRAW) handleGameDraw();
        }
      }
      disableCellInteractions(false);
    }, AI_THINK_DELAY);
  }
}

function showInvalidFeedback(index) {
  const cells = boardEl.querySelectorAll(".cell");
  const cell = cells[index];
  if (cell) { cell.classList.add("invalid"); setTimeout(() => cell.classList.remove("invalid"), 300); }
}

function disableCellInteractions(disabled) {
  boardEl.querySelectorAll(".cell").forEach((c) => {
    c.style.pointerEvents = disabled ? "none" : "";
    c.style.opacity = disabled ? "0.7" : "";
  });
}

function getAIMove() {
  const aiPlayer = gameState.currentPlayer === "X" ? "O" : "X";
  if (settings.opponent === "ai-easy") return easyMove(gameState.board, aiPlayer);
  if (settings.opponent === "ai-normal") return normalMove(gameState.board, aiPlayer);
  if (settings.opponent === "ai-hard") return hardMove(gameState.board, aiPlayer);
  return -1;
}

function isAITurn() { return ["ai-easy", "ai-normal", "ai-hard"].includes(settings.opponent); }

function handleGameWin() {
  const isAI = settings.opponent !== "2p";
  if (gameState.winner === "X") scores.xWins++; else scores.oWins++;
  updateScores(); saveScores(scores); updateStatus(); updateControls();
  if (isAI) {
    const playerMark = settings.startMark;
    const aiMark = playerMark === "X" ? "O" : "X";
    if (gameState.winner === playerMark) {
      startCrazyMode();
      return;
    }
    if (gameState.winner === aiMark) {
      handleAIWin();
      return;
    }
  }
}

function handleAIWin() {
  // Restore the final board state with X and O positions
  renderBoard();
  // Start heartbeat animation (4 seconds, 4 red pulses)
  boardEl.classList.add("board-red-pulse");
  // After heartbeat completes, show nuclear overlay
  setTimeout(() => {
    // Hide regular game elements
    document.querySelector(".scoreboard").style.display = "none";
    document.querySelector(".board-container").style.display = "none";
    document.querySelector(".controls").style.display = "none";
    document.querySelector(".settings-panel").style.display = "none";
    statusEl.style.display = "none";
    // Show nuclear overlay
    nuclearOverlay.style.display = "flex";
    // Force reflow
    nuclearOverlay.offsetHeight;
    nuclearOverlay.classList.add("active");
    // Trigger title animation
    const overlayContent = document.querySelector(".nuclear-overlay .overlay-content");
    setTimeout(() => {
      overlayContent.classList.add("active-title");
    }, 100);
  }, 4000);
}

function handleGameDraw() {
  scores.draws++; updateScores(); saveScores(scores); updateStatus(); updateControls();
}

function startNewRound() {
  roundNumber++;
  playRoundSound();
  // Clear nuclear overlay if active
  if (nuclearOverlay.classList.contains("active")) {
    nuclearOverlay.classList.remove("active");
    nuclearOverlay.style.display = "";
  }
  stopCrazyMode();
  const sm = getStartingMark(settings, roundNumber);
  gameState = createInitialState({ startingMark: sm });
  clearGameState();
  renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
}

function handleUndo() {
  if (!canUndo(gameState)) return;
  const prev = undoMove(gameState);
  if (!prev) return;
  gameState = prev;
  renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
}

function handleResetMatch() {
  playRoundSound();
  stopCrazyMode();
  scores = { xWins: 0, oWins: 0, draws: 0 }; roundNumber = 0;
  const sm = getStartingMark(settings, roundNumber);
  gameState = createInitialState({ startingMark: sm });
  clearGameState();
  updateScores(); renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
}

function handleOpponentChange() { settings.opponent = opponentSelect.value; saveSettings(settings); startNewRound(); }
function updatePlayerNames() {
  const isAI = settings.opponent !== "2p";
  xMarkLabelEl.textContent = "Player 1";
  oMarkLabelEl.textContent = isAI ? "Joshua minimax (AI)" : "Player 2";
}

function playRoundSound() {
  if (roundAudio) {
    roundAudio.currentTime = 0;
    roundAudio.play().catch(() => {});
  }
}
function startCrazyMode() {
  crazyModeActive = true;
  const startTime = Date.now();
  const duration = 10000;
  const interval = 167;
  crazyInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= duration) {
      clearInterval(crazyInterval);
      crazyInterval = null;
      crazyModeActive = false;
      boardEl.classList.add("board-faded");
      boardEl.style.pointerEvents = "none";
      return;
    }
    for (let i = 0; i < 9; i++) {
      if (boardEl.children[i]) {
        boardEl.children[i].textContent = "";
      }
    }
    for (let i = 0; i < 9; i++) {
      if (boardEl.children[i]) {
        const mark = Math.random() > 0.5 ? "X" : "O";
        boardEl.children[i].textContent = mark;
      }
    }
    boardEl.classList.toggle("board-crazy-blink");
  }, interval);
}

function stopCrazyMode() {
  if (crazyInterval) {
    clearInterval(crazyInterval);
    crazyInterval = null;
  }
  crazyModeActive = false;
  boardEl.classList.remove("board-crazy", "board-crazy-blink");
  boardEl.classList.remove("board-faded");
  boardEl.style.pointerEvents = "";
}
function handleStartMarkChange() { settings.startMark = startMarkSelect.value; saveSettings(settings); startNewRound(); }

function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  applyTheme(theme); saveTheme(theme);
}

function applyTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  if (themeToggleBtn) {
    const sp = themeToggleBtn.querySelector("#theme-icon");
    if (sp) sp.textContent = themeName === "dark" ? "☀️" : "🌙";
    themeToggleBtn.setAttribute("aria-label", "Switch to " + (themeName === "dark" ? "light" : "dark") + " theme");
  }
}

function renderBoard() {
  const cells = boardEl.querySelectorAll(".cell");
  const isOver = gameState.state !== STATES.IN_PROGRESS;
  const winSet = new Set(gameState.winningLine || []);
  cells.forEach((cell, idx) => {
    const val = gameState.board[idx];
    cell.className = "cell"; cell.textContent = ""; cell.removeAttribute("data-preview");
    if (val) {
      cell.classList.add("occupied", val === "X" ? "x-cell" : "o-cell");
      cell.textContent = val;
      cell.setAttribute("aria-label", "Cell " + idx + ", " + val);
    } else {
      cell.setAttribute("aria-label", "Cell " + idx + ", empty");
      if (!isOver) {
        const showPrev = ENABLE_AI ? !isAITurn() : true;
        if (showPrev) { cell.classList.add("preview-" + gameState.currentPlayer.toLowerCase()); cell.setAttribute("data-preview", gameState.currentPlayer); }
      }
    }
    if (winSet.has(idx)) cell.classList.add("win-cell");
    if (isOver) cell.classList.add("game-over");
  });
}

function updateStatus() {
  if (gameState.state === STATES.WON) {
    statusEl.textContent = "Player " + gameState.winner + " wins! 🎉";
    statusEl.style.backgroundColor = "var(--win-highlight-bg)"; statusEl.style.color = "var(--win-highlight)";
  } else if (gameState.state === STATES.DRAW) {
    statusEl.textContent = "It's a draw! 🤝";
    statusEl.style.backgroundColor = "var(--status-bg)"; statusEl.style.color = "var(--status-text)";
  } else {
    statusEl.textContent = "Player " + gameState.currentPlayer + "'s turn";
    statusEl.style.backgroundColor = "var(--status-bg)"; statusEl.style.color = "var(--status-text)";
  }
}

function updateScores() { xWinsEl.textContent = scores.xWins; oWinsEl.textContent = scores.oWins; drawCountEl.textContent = scores.draws; }
function updateControls() { undoBtn.disabled = !canUndo(gameState); }

function announceToScreenReader() {
  let msg = "";
  if (gameState.state === STATES.WON) msg = "Player " + gameState.winner + " wins the round!";
  else if (gameState.state === STATES.DRAW) msg = "The round is a draw.";
  else msg = "Player " + gameState.currentPlayer + "'s turn.";
  statusEl.setAttribute("aria-live", "polite"); statusEl.textContent = msg;
}
