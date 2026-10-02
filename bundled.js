// ========================================
// localStorage Persistence
// ========================================

const STORAGE_KEYS = {
  SCORES: 'ttt_scores',
  SETTINGS: 'ttt_settings',
  GAME_STATE: 'ttt_game_state',
  THEME: 'ttt_theme',
};

// Default values
const DEFAULTS = {
  scores: { xWins: 0, oWins: 0, draws: 0 },
  settings: { startMark: 'X', opponent: '2p' },
  theme: 'light',
};

function saveScores(scores) {
  try {
    const validated = {
      xWins: Math.max(0, Math.floor(scores.xWins || 0)),
      oWins: Math.max(0, Math.floor(scores.oWins || 0)),
      draws: Math.max(0, Math.floor(scores.draws || 0)),
    };
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(validated));
    return true;
  } catch {
    return false;
  }
}

function loadScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES);
    if (!data) return { ...DEFAULTS.scores };
    const parsed = JSON.parse(data);
    if (
      typeof parsed.xWins === 'number' &&
      typeof parsed.oWins === 'number' &&
      typeof parsed.draws === 'number' &&
      parsed.xWins >= 0 &&
      parsed.oWins >= 0 &&
      parsed.draws >= 0
    ) {
      return { xWins: parsed.xWins, oWins: parsed.oWins, draws: parsed.draws };
    }
    return { ...DEFAULTS.scores };
  } catch {
    return { ...DEFAULTS.scores };
  }
}

function saveSettings(settings) {
  try {
    const validated = {
      startMark: ['X', 'O', 'alternate'].includes(settings.startMark)
        ? settings.startMark
        : 'X',
      opponent: ['2p', 'ai-easy', 'ai-normal', 'ai-hard'].includes(settings.opponent)
        ? settings.opponent
        : '2p',
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(validated));
    return true;
  } catch {
    return false;
  }
}

function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return { ...DEFAULTS.settings };
    const parsed = JSON.parse(data);
    return {
      startMark: ['X', 'O', 'alternate'].includes(parsed.startMark)
        ? parsed.startMark
        : 'X',
      opponent: ['2p', 'ai-easy', 'ai-normal', 'ai-hard'].includes(parsed.opponent)
        ? parsed.opponent
        : '2p',
    };
  } catch {
    return { ...DEFAULTS.settings };
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    return true;
  } catch {
    return false;
  }
}

function loadTheme() {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function resetAll() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    return true;
  } catch {
    return false;
  }
}

function saveGameState(gameState) {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
    return true;
  } catch {
    return false;
  }
}

function loadGameState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    return true;
  } catch {
    return false;
  }
}

// ========================================
// Game Rules Engine
// ========================================

window.TTT.STATES = {
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  DRAW: 'DRAW',
};

window.TTT.WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

window.TTT.ERRORS = {
  CELL_OCCUPIED: 'CELL_OCCUPIED',
  GAME_OVER: 'GAME_OVER',
  INVALID_PLAYER: 'INVALID_PLAYER',
  INVALID_CELL: 'INVALID_CELL',
};

function evaluate(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line, status: STATES.WON };
    }
  }
  if (isDraw(board)) {
    return { winner: null, line: null, status: STATES.DRAW };
  }
  return { winner: null, line: null, status: STATES.IN_PROGRESS };
}

function isDraw(board) {
  return board.every((cell) => cell !== null);
}

function getValidMoves(stateOrBoard) {
  const board = Array.isArray(stateOrBoard) ? stateOrBoard : stateOrBoard.board;
  return board.map((cell, index) => (cell === null ? index : -1)).filter((i) => i !== -1);
}

function undoMove(state) {
  if (state.history.length === 0) return null;
  const prev = state.history[state.history.length - 1];
  return {
    board: [...prev.board],
    currentPlayer: prev.currentPlayer,
    startingMark: state.startingMark,
    state: prev.state,
    winner: prev.winner,
    winningLine: prev.winningLine,
    history: state.history.slice(0, -1),
    moveCount: prev.moveCount,
  };
}

function canUndo(state) {
  return state.history.length > 0 && state.state === STATES.IN_PROGRESS;
}

function getStartingMark(settings, roundNumber = 0) {
  const { startMark } = settings || {};
  if (startMark === 'X') return 'X';
  if (startMark === 'O') return 'O';
  if (startMark === 'alternate') return roundNumber % 2 === 0 ? 'X' : 'O';
  return 'X';
}

function validateScoreInvariant(xWins, oWins) {
  return Number.isInteger(xWins) && Number.isInteger(oWins) && xWins >= 0 && oWins >= 0;
}

function getOpponent(player) {
  return player === 'X' ? 'O' : 'X';
}

function createInitialState({ startingMark = 'X' } = {}) {
  return {
    board: Array(9).fill(null),
    currentPlayer: startingMark,
    startingMark,
    state: STATES.IN_PROGRESS,
    winner: null,
    winningLine: null,
    history: [],
    moveCount: 0,
  };
}

function applyMove(state, cell, player) {
  if (typeof cell !== 'number' || cell < 0 || cell > 8 || !Number.isInteger(cell)) {
    return { success: false, error: ERRORS.INVALID_CELL };
  }
  if (state.state !== STATES.IN_PROGRESS) {
    return { success: false, error: ERRORS.GAME_OVER };
  }
  if (state.board[cell] !== null) {
    return { success: false, error: ERRORS.CELL_OCCUPIED };
  }
  const mark = player || state.currentPlayer;
  if (mark !== 'X' && mark !== 'O') {
    return { success: false, error: ERRORS.INVALID_PLAYER };
  }
  const prevState = {
    board: [...state.board],
    currentPlayer: state.currentPlayer,
    state: state.state,
    winner: state.winner,
    winningLine: state.winningLine,
    moveCount: state.moveCount,
  };
  const newBoard = [...state.board];
  newBoard[cell] = mark;
  const newState = {
    ...state,
    board: newBoard,
    history: [...state.history, prevState],
    moveCount: state.moveCount + 1,
  };
  const result = evaluate(newBoard);
  if (result.winner) {
    return {
      success: true,
      state: { ...newState, state: STATES.WON, winner: result.winner, winningLine: result.line, currentPlayer: mark === 'X' ? 'O' : 'X' },
    };
  }
  if (isDraw(newBoard)) {
    return {
      success: true,
      state: { ...newState, state: STATES.DRAW, currentPlayer: mark === 'X' ? 'O' : 'X' },
    };
  }
  return {
    success: true,
    state: { ...newState, state: STATES.IN_PROGRESS, currentPlayer: mark === 'X' ? 'O' : 'X' },
  };
}

// ========================================
// Computer Opponent (AI)
// ========================================

// removed

/**
 * Easy AI: Random legal move
 * @param {Array} board
 * @param {string} aiPlayer
 * @returns {number} Cell index
 */
function easyMove(board, aiPlayer) {
  const valid = getValidMoves(board);
  if (valid.length === 0) return -1;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Normal AI: Minimax with depth limit, blocks threats, takes wins
 * @param {Array} board
 * @param {string} aiPlayer
 * @param {number} [depthLimit=4]
 * @returns {number} Cell index
 */
function normalMove(board, aiPlayer, depthLimit = 4) {
  const valid = getValidMoves(board);
  if (valid.length === 0) return -1;

  // If first move, take center or corner for better strategy
  if (valid.length === 9) return 4; // center
  if (valid.length === 8 && board[4] === null) return 4; // take center if available

  let bestScore = -Infinity;
  let bestCell = valid[0];

  for (const cell of valid) {
    const newBoard = [...board];
    newBoard[cell] = aiPlayer;
    const score = minimax(newBoard, 0, false, aiPlayer, -Infinity, Infinity, depthLimit);
    if (score > bestScore) {
      bestScore = score;
      bestCell = cell;
    }
  }

  return bestCell;
}

function minimax(board, depth, isMaximizing, aiPlayer, alpha, beta, depthLimit) {
  const opponent = getOpponent(aiPlayer);
  const result = evaluate(board);
  if (result.status === STATES.WON) {
    return result.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (result.status === STATES.DRAW) return 0;
  if (depth >= depthLimit) {
    return 0;
  }
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const eval_ = minimax(board, depth + 1, false, aiPlayer, alpha, beta, depthLimit);
        board[i] = null;
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        const eval_ = minimax(board, depth + 1, true, aiPlayer, alpha, beta, depthLimit);
        board[i] = null;
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

/**
 * Hard AI: Full minimax (unbeatable)
 * @param {Array} board
 * @param {string} aiPlayer
 * @returns {number} Cell index
 */
function hardMove(board, aiPlayer) {
  const valid = getValidMoves(board);
  if (valid.length === 0) return -1;
  let bestScore = -Infinity;
  let bestCell = valid[0];
  for (const cell of valid) {
    const newBoard = [...board];
    newBoard[cell] = aiPlayer;
    const score = minimaxFull(newBoard, 0, false, aiPlayer, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestCell = cell;
    }
  }
  return bestCell;
}

function minimaxFull(board, depth, isMaximizing, aiPlayer, alpha, beta) {
  const opponent = getOpponent(aiPlayer);
  const result = evaluate(board);
  if (result.status === STATES.WON) {
    return result.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (result.status === STATES.DRAW) return 0;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const eval_ = minimaxFull(board, depth + 1, false, aiPlayer, alpha, beta);
        board[i] = null;
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        const eval_ = minimaxFull(board, depth + 1, true, aiPlayer, alpha, beta);
        board[i] = null;
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

// ========================================
// UI Controller
// ========================================

const ENABLE_AI = true;
const AI_THINK_DELAY = 300;

// removed
// removed
// removed
// removed

let boardEl, statusEl, xWinsEl, oWinsEl, drawCountEl;
let newRoundBtn, undoBtn, resetBtn, themeToggleBtn;
let opponentSelect, startMarkSelect;
let gameState, scores, settings, roundNumber, theme;
let xMarkLabelEl, oMarkLabelEl;
let roundAudio;
let bgMusicEl, musicToggleBtn;
let musicPlaying = false;

function initApp() {
  boardEl = document.getElementById("board");
  statusEl = document.getElementById("status");
  xWinsEl = document.getElementById("x-wins");
  oWinsEl = document.getElementById("o-wins");
  drawCountEl = document.getElementById("draw-count");
  xMarkLabelEl = document.getElementById("x-mark-label");
  oMarkLabelEl = document.getElementById("o-mark-label");
  newRoundBtn = document.getElementById("new-round");
  undoBtn = document.getElementById("undo-move");
  resetBtn = document.getElementById("reset-match");
  themeToggleBtn = document.getElementById("theme-toggle");
  opponentSelect = document.getElementById("opponent-select");
  startMarkSelect = document.getElementById("start-mark-select");
  roundAudio = document.getElementById("round-audio");
  bgMusicEl = document.getElementById("bg-music");
  musicToggleBtn = document.getElementById("music-toggle");
  if (roundAudio) {
    roundAudio.currentTime = 0;
    roundAudio.play().catch(() => {});
  }
  if (bgMusicEl) {
    bgMusicEl.volume = 0.3;
    bgMusicEl.play().then(() => { musicPlaying = true; musicToggleBtn.textContent = "🔊"; }).catch(() => {});
  }
  scores = loadScores();
  settings = loadSettings();
  theme = loadTheme();
  roundNumber = 0;
  applyTheme(theme);
  opponentSelect.value = settings.opponent;
  startMarkSelect.value = settings.startMark;
  xMarkLabelEl = document.getElementById("x-mark-label");
  oMarkLabelEl = document.getElementById("o-mark-label");
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

function createBoard() {
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
  boardEl.addEventListener("keydown", handleCellKeydown);
  newRoundBtn.addEventListener("click", startNewRound);
  undoBtn.addEventListener("click", handleUndo);
  resetBtn.addEventListener("click", handleResetMatch);
  themeToggleBtn.addEventListener("click", toggleTheme);
  musicToggleBtn.addEventListener("click", toggleMusic);
  opponentSelect.addEventListener("change", handleOpponentChange);
  startMarkSelect.addEventListener("change", handleStartMarkChange);
}

function handleCellClick(e) {
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
  renderBoard();
  if (gameState.state === STATES.IN_PROGRESS) {
    updateStatus(); updateControls();
    if (ENABLE_AI && isAITurn() && gameState.currentPlayer === "O") {
      setTimeout(() => {
        if (gameState.state === STATES.IN_PROGRESS) {
          const aiMove = getAIMove();
          if (aiMove !== -1) makeMove(aiMove);
        }
      }, AI_THINK_DELAY);
    }
  } else {
    handleGameResult();
    announceToScreenReader();
  }
}

function showInvalidFeedback(index) {
  const cells = boardEl.querySelectorAll(".cell");
  const cell = cells[index];
  if (!cell) return;
  cell.classList.add("invalid");
  setTimeout(() => cell.classList.remove("invalid"), 500);
}

function getAIMove() {
  const aiPlayer = gameState.currentPlayer === "X" ? "O" : "X";
  if (settings.opponent === "ai-easy") return easyMove(gameState.board, aiPlayer);
  if (settings.opponent === "ai-normal") return normalMove(gameState.board, aiPlayer);
  if (settings.opponent === "ai-hard") return hardMove(gameState.board, aiPlayer);
  return -1;
}
function isAITurn() { return ["ai-easy", "ai-normal", "ai-hard"].includes(settings.opponent); }

function getPlayerNames() {
  if (settings.opponent === "2p") {
    return { X: "Player 1", O: "Player 2" };
  }
  return { X: "Player 1", O: "Joshua (minimax)" };
}

function updatePlayerNames() {
  const names = getPlayerNames();
  if (xMarkLabelEl) xMarkLabelEl.textContent = names.X;
  if (oMarkLabelEl) oMarkLabelEl.textContent = names.O;
}

function handleGameResult() {
  if (gameState.state === STATES.WON) handleGameWin();
  else if (gameState.state === STATES.DRAW) handleGameDraw();
}

function handleGameWin() {
  if (gameState.winner === "X") scores.xWins++; else scores.oWins++;
  updateScores(); saveScores(scores); updateStatus(); updateControls();
}

function handleGameDraw() {
  scores.draws++; updateScores(); saveScores(scores); updateStatus(); updateControls();
}

function startNewRound() {
  roundNumber++;
  const sm = getStartingMark(settings, roundNumber);
  gameState = createInitialState({ startingMark: sm });
  if (roundAudio) {
    roundAudio.currentTime = 0;
    roundAudio.play().catch(() => {});
  }
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
  scores = { xWins: 0, oWins: 0, draws: 0 }; roundNumber = 0;
  updatePlayerNames();
  const sm = getStartingMark(settings, roundNumber);
  gameState = createInitialState({ startingMark: sm });
  clearGameState();
  updateScores(); renderBoard(); updateStatus(); updateControls(); announceToScreenReader();
}

function handleOpponentChange() { settings.opponent = opponentSelect.value; saveSettings(settings); startNewRound(); }
function handleStartMarkChange() { settings.startMark = startMarkSelect.value; saveSettings(settings); startNewRound(); }

function toggleMusic() {
  if (!bgMusicEl) return;
  if (musicPlaying) {
    bgMusicEl.pause();
    musicPlaying = false;
    musicToggleBtn.textContent = "🔇";
  } else {
    bgMusicEl.play().catch(() => {});
    musicPlaying = true;
    musicToggleBtn.textContent = "🔊";
  }
}

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
  const names = getPlayerNames();
  if (gameState.state === STATES.WON) {
    statusEl.textContent = names[gameState.winner] + " wins! 🎉";
    statusEl.style.backgroundColor = "var(--win-highlight-bg)"; statusEl.style.color = "var(--win-highlight)";
  } else if (gameState.state === STATES.DRAW) {
    statusEl.textContent = "It's a draw! 🤝";
    statusEl.style.backgroundColor = "var(--status-bg)"; statusEl.style.color = "var(--status-text)";
  } else {
    statusEl.textContent = names[gameState.currentPlayer] + "'s turn";
    statusEl.style.backgroundColor = "var(--status-bg)"; statusEl.style.color = "var(--status-text)";
  }
}

function updateScores() { xWinsEl.textContent = scores.xWins; oWinsEl.textContent = scores.oWins; drawCountEl.textContent = scores.draws; }
function updateControls() { undoBtn.disabled = !canUndo(gameState); }

function announceToScreenReader() {
  const names = getPlayerNames();
  let msg = "";
  if (gameState.state === STATES.WON) msg = names[gameState.winner] + " wins the round!";
  else if (gameState.state === STATES.DRAW) msg = "The round is a draw.";
  else msg = names[gameState.currentPlayer] + "'s turn.";
  statusEl.setAttribute("aria-live", "polite"); statusEl.textContent = msg;
}
