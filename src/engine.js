
export function evaluate(board) {
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

export function isDraw(board) {
  return board.every((cell) => cell !== null);
}

export function getValidMoves(stateOrBoard) {
  const board = Array.isArray(stateOrBoard) ? stateOrBoard : stateOrBoard.board;
  return board.map((cell, index) => (cell === null ? index : -1)).filter((i) => i !== -1);
}

export function undoMove(state) {
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

export function canUndo(state) {
  return state.history.length > 0 && state.state === STATES.IN_PROGRESS;
}

export function getStartingMark(settings, roundNumber = 0) {
  const { startMark } = settings || {};
  if (startMark === 'X') return 'X';
  if (startMark === 'O') return 'O';
  if (startMark === 'alternate') return roundNumber % 2 === 0 ? 'X' : 'O';
  return 'X';
}

export function validateScoreInvariant(xWins, oWins) {
  return Number.isInteger(xWins) && Number.isInteger(oWins) && xWins >= 0 && oWins >= 0;
}

export function getOpponent(player) {
  return player === 'X' ? 'O' : 'X';
}
// ========================================
// Game Rules Engine
// ========================================

export const STATES = {
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  DRAW: 'DRAW',
};

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const ERRORS = {
  CELL_OCCUPIED: 'CELL_OCCUPIED',
  GAME_OVER: 'GAME_OVER',
  INVALID_PLAYER: 'INVALID_PLAYER',
  INVALID_CELL: 'INVALID_CELL',
};

export function createInitialState({ startingMark = 'X' } = {}) {
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

export function applyMove(state, cell, player) {
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