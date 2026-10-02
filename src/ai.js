// ========================================
// Computer Opponent (AI)
// ========================================

import { getValidMoves, getOpponent, WINNING_LINES } from './engine.js';

/**
 * Easy AI: Random legal move
 * @param {Array} board
 * @param {string} aiPlayer
 * @returns {number} Cell index
 */
export function easyMove(board, aiPlayer) {
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
export function normalMove(board, aiPlayer, depthLimit = 4) {
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

/**
 * Hard AI: Full minimax (unbeatable)
 * @param {Array} board
 * @param {string} aiPlayer
 * @returns {number} Cell index
 */
export function hardMove(board, aiPlayer) {
  return normalMove(board, aiPlayer, Infinity);
}

// Internal minimax with alpha-beta pruning
function minimax(board, depth, isMaximizing, aiPlayer, alpha, beta, depthLimit) {
  const opponent = getOpponent(aiPlayer);

  // Check terminal states
  const result = checkWinner(board);
  if (result === aiPlayer) return 10 - depth;
  if (result === opponent) return depth - 10;
  if (isBoardFull(board)) return 0;
  if (depthLimit !== Infinity && depth >= depthLimit) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const evalScore = minimax(board, depth + 1, false, aiPlayer, alpha, beta, depthLimit);
        board[i] = null;
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        const evalScore = minimax(board, depth + 1, true, aiPlayer, alpha, beta, depthLimit);
        board[i] = null;
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function isBoardFull(board) {
  return board.every((cell) => cell !== null);
}