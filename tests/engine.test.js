// Engine Unit Tests
import { STATES, WINNING_LINES, createInitialState, applyMove, evaluate, isDraw, getValidMoves, undoMove, canUndo, getStartingMark, validateScoreInvariant, getOpponent, ERRORS } from "../src/engine.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log("  PASS: " + message); }
  else { failed++; console.log("  FAIL: " + message); }
}

console.log("\n=== Engine Tests ===\n");

// Test: createInitialState
console.log("1. createInitialState");
{
  const s = createInitialState();
  assert(s.board.length === 9, "creates 9-cell board");
  assert(s.board.every((c) => c === null), "all cells empty");
  assert(s.currentPlayer === "X", "X starts by default");
  assert(s.state === STATES.IN_PROGRESS, "state is IN_PROGRESS");
  assert(s.history.length === 0, "no history");
  assert(s.moveCount === 0, "move count 0");
}
{
  const s = createInitialState({ startingMark: "O" });
  assert(s.currentPlayer === "O", "custom starting mark works");
}

// Test: applyMove
console.log("\n2. applyMove");
{
  const s = createInitialState();
  const r = applyMove(s, 4);
  assert(r.success, "move accepted");
  assert(r.state.board[4] === "X", "X placed at center");
  assert(r.state.currentPlayer === "O", "turn switched to O");
  assert(r.state.state === STATES.IN_PROGRESS, "still in progress");
  assert(r.state.history.length === 1, "history has 1 entry");
}
{
  const s = createInitialState();
  const r1 = applyMove(s, 0);
  const r2 = applyMove(r1.state, 0);
  assert(!r2.success, "occupied cell rejected");
  assert(r2.error === ERRORS.CELL_OCCUPIED, "correct error code");
}
{
  const s = createInitialState();
  const r = applyMove(s, 9);
  assert(!r.success, "invalid cell index rejected");
  assert(r.error === ERRORS.INVALID_CELL, "INVALID_CELL error");
}
{
  let s = createInitialState();
  for (let i = 0; i < 9; i++) {
    const r = applyMove(s, i);
    if (!r.success) break;
    s = r.state;
  }
  const r = applyMove(s, 0);
  assert(!r.success, "move rejected when game over");
  assert(r.error === ERRORS.GAME_OVER, "GAME_OVER error");
}

// Test: win detection
console.log("\n3. Win detection");
{
  let s = createInitialState();
  let r = applyMove(s, 0); s = r.state;
  r = applyMove(s, 1); s = r.state;
  r = applyMove(s, 4); s = r.state;
  r = applyMove(s, 3); s = r.state;
  r = applyMove(s, 8); s = r.state;
  assert(s.state === STATES.WON, "game state is WON");
  assert(s.winner === "X", "winner is X");
  assert(s.winningLine && s.winningLine[0] === 0 && s.winningLine[2] === 8, "winning line is [0,4,8]");
}

// Test: all 8 winning lines
console.log("\n4. All 8 winning lines");
for (let lineIdx = 0; lineIdx < WINNING_LINES.length; lineIdx++) {
  const line = WINNING_LINES[lineIdx];
  const board = Array(9).fill(null);
  for (const ci of line) { board[ci] = "X"; }
  const result = evaluate(board);
  assert(result.status === STATES.WON && result.winner === "X", "line " + lineIdx + " " + JSON.stringify(line) + " detected");
}

// Test: draw
console.log("\n5. Draw detection");
{
  const board = ["X","O","X","O","X","O","O","X","O"];
  const r = evaluate(board);
  assert(r.status === STATES.DRAW, "full board with no win is DRAW");
}

// Test: win on last move (9th)
console.log("\n6. Win on last move");
{
  let s = createInitialState();
  const board = Array(9).fill(null);
  board[0] = "X"; board[4] = "X"; board[8] = "X";
  board[1] = "O"; board[3] = "O"; board[5] = "O";
  board[2] = "O"; board[6] = "O"; board[7] = "O";
  const r = evaluate(board);
  assert(r.status === STATES.WON, "win on 9th move detected");
  assert(r.winner === "X", "correct winner");
}

// Test: undo
console.log("\n7. Undo");
{
  let s = createInitialState();
  assert(!canUndo(s), "cannot undo on new game");
  const r1 = applyMove(s, 0); s = r1.state;
  assert(canUndo(s), "can undo after 1 move");
  const prev = undoMove(s);
  assert(prev.board[0] === null, "cell cleared after undo");
  assert(prev.currentPlayer === "X", "turn reverted to X");
  assert(!canUndo(prev), "cannot undo after 1 undo");
}

// Test: getValidMoves
console.log("\n8. Valid moves");
{
  let s = createInitialState();
  assert(getValidMoves(s).length === 9, "all 9 cells valid at start");
  const r = applyMove(s, 4); s = r.state;
  assert(getValidMoves(s).length === 8, "8 cells valid after 1 move");
  assert(!getValidMoves(s).includes(4), "occupied cell not in valid moves");
}

// Test: getStartingMark
console.log("\n9. Starting mark settings");
{
  assert(getStartingMark({ startMark: "X" }, 0) === "X", "X always starts");
  assert(getStartingMark({ startMark: "O" }, 0) === "O", "O always starts");
  assert(getStartingMark({ startMark: "alternate" }, 0) === "X", "alternate round 0 = X");
  assert(getStartingMark({ startMark: "alternate" }, 1) === "O", "alternate round 1 = O");
  assert(getStartingMark({}, 0) === "X", "default = X");
}

// Test: validateScoreInvariant
console.log("\n10. Score validation");
{
  assert(validateScoreInvariant(5, 3) === true, "valid scores");
  assert(validateScoreInvariant(-1, 3) === false, "negative xWins invalid");
  assert(validateScoreInvariant(5, -1) === false, "negative oWins invalid");
  assert(validateScoreInvariant(0, 0) === true, "zero scores valid");
}

// Test: getOpponent
console.log("\n11. getOpponent");
{
  assert(getOpponent("X") === "O", "X opponent is O");
  assert(getOpponent("O") === "X", "O opponent is X");
}

// Test: evaluate
console.log("\n12. evaluate function");
{
  const e1 = evaluate(Array(9).fill(null));
  assert(e1.status === STATES.IN_PROGRESS, "empty board = IN_PROGRESS");
  const full = ["X","O","X","O","X","O","O","X","O"];
  const e2 = evaluate(full);
  assert(e2.status === STATES.DRAW, "full no-win = DRAW");
  const rowWin = ["X","X","X","O","O",null,"O","X",null];
  const e3 = evaluate(rowWin);
  assert(e3.status === STATES.WON && e3.winner === "X", "row win detected");
  assert(e3.line[0] === 0 && e3.line[2] === 2, "correct winning line");
}

// Test: isDraw
console.log("\n13. isDraw function");
{
  assert(!isDraw(Array(9).fill(null)), "empty is not draw");
  assert(isDraw(["X","O","X","O","X","O","O","X","O"]), "full is draw (no win)");
}

// Summary
console.log("\n=== Results ===");
console.log("Passed: " + passed);
console.log("Failed: " + failed);
console.log("Total: " + (passed + failed));
console.log(failed === 0 ? "\nAll tests passed! \u2705" : "\nSome tests failed! \u274c");

process.exit(failed > 0 ? 1 : 0);
