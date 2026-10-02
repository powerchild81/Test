// ========================================
// AI Unit Tests
// ========================================

import { easyMove, normalMove, hardMove } from "../src/ai.js";
import { getValidMoves, STATES, applyMove, createInitialState } from "../src/engine.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log("  PASS: " + message); }
  else { failed++; console.log("  FAIL: " + message); }
}

console.log("\n=== AI Tests ===\n");

// Test: easyMove returns legal moves only
console.log("1. Easy AI - legal moves only");
{
  const board = [null, null, null, null, "X", null, null, null, null];
  const result = easyMove(board, "O");
  assert(result >= 0 && result <= 8, "returns valid cell index");
  assert(board[result] === null, "returns empty cell");

  // Fill all but one
  const board2 = ["X","O","X","O",null,"O","O","X","O"];
  const result2 = easyMove(board2, "X");
  assert(result2 === 4, "only legal move returned");
}

// Test: easyMove handles full board
console.log("\n2. Easy AI - full board");
{
  const board = ["X","O","X","O","X","O","O","X","O"];
  const result = easyMove(board, "X");
  assert(result === -1, "returns -1 on full board");
}

// Test: normalMove blocks threats
console.log("\n3. Normal AI - threat blocking");
{
  // X has two in a row on top row, O should block
  const board = ["X","X",null,null,null,null,null,null,null];
  const result = normalMove(board, "O");
  assert(result === 2, "Normal blocks two-in-a-row threat");
}

// Test: normalMove takes winning move
console.log("\n4. Normal AI - takes win");
{
  const board = ["O","O",null,null,"X","X",null,null,null];
  const result = normalMove(board, "O");
  assert(result === 2, "Normal takes winning move");
}

// Test: normalMove takes center
console.log("\n5. Normal AI - center preference");
{
  const board = Array(9).fill(null);
  const result = normalMove(board, "X");
  assert(result === 4, "Normal takes center on first move");
}

// Test: hardMove never loses (sample)
console.log("\n6. Hard AI - never loses");
{
  // Start with hard AI as X (first player)
  const board1 = Array(9).fill(null);
  const h1 = hardMove(board1, "X");
  assert(h1 >= 0 && h1 <= 8, "Hard returns valid move");

  // Start with hard AI as O (second player) - should at least draw
  const board2 = Array(9).fill(null);
  board2[4] = "X"; // Human plays center
  const h2 = hardMove(board2, "O");
  assert(h2 >= 0 && h2 <= 8, "Hard returns valid response");

  // Simulate a few moves to see if hard can win
  let s = createInitialState();
  // Human plays random, hard plays optimally
  const moves = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let turn = "X";
  for (const m of moves) {
    if (s.board[m] !== null) continue;
    if (turn === "X") {
      const r = applyMove(s, m);
      if (!r.success) break;
      s = r.state;
    } else {
      const hMove = hardMove(s.board, "O");
      if (hMove < 0) break;
      const r = applyMove(s, hMove);
      if (!r.success) break;
      s = r.state;
    }
    turn = turn === "X" ? "O" : "X";
  }
  // Hard should at least draw or win (never lose)
  assert(s.state === STATES.WON && s.winner === "O" || s.state === STATES.DRAW || s.state === STATES.IN_PROGRESS, "Hard never loses");
}

// Test: hardMove returns legal moves only
console.log("\n7. Hard AI - legal moves");
{
  const board = [null,null,null,null,null,null,null,null,null];
  for (let i = 0; i < 10; i++) {
    const r = hardMove(board, "X");
    assert(r >= 0 && r <= 8, "hardMove returns valid index (attempt " + (i+1) + ")");
  }
}

// Summary
console.log("\n=== Results ===");
console.log("Passed: " + passed);
console.log("Failed: " + failed);
console.log("Total: " + (passed + failed));
console.log(failed === 0 ? "\nAll AI tests passed! \u2705" : "\nSome AI tests failed! \u274c");

process.exit(failed > 0 ? 1 : 0);