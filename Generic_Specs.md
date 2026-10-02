# Generic Specification — Tic-Tac-Toe Web Application

| Field | Value |
|---|---|
| Project | Test |
| Document | `Generic_Specs.md` |
| Application name (working) | Tic-Tac-Toe Web |
| Type | Client-side single-page web application (SPA) |
| Version | 1.0 |
| Status | Draft for review |
| Last updated | 2026-03-18 |

---

## 1. Purpose & Scope

### 1.1 Purpose
Define a browser-playable implementation of the classic paper-and-pencil game **Tic-Tac-Toe** (noughts and crosses). A single HTML page must be sufficient for a user to start a game, take turns, see the outcome and restart, with no installation, no account and no server-side game state.

### 1.2 In scope (v1.0)
- 3×3 board, two players (`X` and `O`), local hot-seat play on the same device.
- Turn enforcement, win/draw detection, score tracking across rounds, restart controls.
- Optional built-in computer opponent (Easy / Normal) as a feature-flagged add-on (§6).
- Full keyboard and mouse/touch support, accessible to screen-reader users.
- State persistence across page reloads using `localStorage` (§8).

### 1.3 Out of scope (v1.0)
- Online/multiplayer over a network, matchmaking, accounts, authentication.
- Boards larger than 3×3, misère rules, Gambit/Ultimate Tic-Tac-Toe variants.
- Native mobile apps, offline installable PWA (candidate for v1.1).
- Analytics backends, advertising, third-party tracking of any kind.

---

## 2. Definitions

| Term | Meaning |
|---|---|
| Cell | One of the 9 positions of the board, indexed 0–8 (row-major, top-left = 0). |
| Move | Placement of a player's mark into an empty cell. |
| Turn | The right of one player to make exactly one move. |
| Line | Any of the 8 winning triples: 3 rows, 3 columns, 2 diagonals. |
| Win | A player owns all 3 cells of at least one line. |
| Draw ("Cat's game") | Board full with no win. |
| Round | One complete game from empty board to terminal state. |
| Match | A series of rounds; the running score is the match score. |

Winning line indices: `[0,1,2] [3,4,5] [6,7,8] [0,3,6] [1,4,7] [2,5,8] [0,4,8] [2,4,6]`.

---

## 3. Functional Requirements

Priority: **M** = must, **S** = should, **C** = could (MoSCoW).

### 3.1 Game setup
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | On first load the app shall render an empty 3×3 grid and be ready to play with no configuration step. | M |
| FR-02 | The app shall display the current player's mark prominently (status line) before the first move. | M |
| FR-03 | `X` shall take the first turn of every round by default. | M |
| FR-04 | The app shall offer a setting to choose the starting mark for a round (`X`, `O`, or alternate each round). | S |
| FR-05 | The app shall offer an opponent selector: "2 Players (local)" (default) or "Computer". | S |

### 3.2 Playing a move
| ID | Requirement | Priority |
|---|---|---|
| FR-06 | Clicking/tapping an empty cell shall place the current player's mark in it. | M |
| FR-07 | Clicking an already-occupied cell shall be a no-op: no mark change, no turn change, no score change. A brief visual "invalid" affordance may be shown. | M |
| FR-08 | A move shall only be accepted while the game state is `IN_PROGRESS`. | M |
| FR-09 | After a valid move the app shall switch the turn to the other player and update the status line within 100 ms. | M |
| FR-10 | The app shall never allow more than one mark difference between the two players (`count(X) − count(O)` ∈ {0, 1} while `X` starts). | M |
| FR-11 | Hovering/focusing an empty cell shall preview the current player's mark at reduced opacity (≥ 0.35 contrast-safe). | S |
| FR-12 | Keyboard users shall be able to select a cell with Tab/arrow keys and commit a move with `Enter` or `Space`. | M |
| FR-13 | The app shall ignore a second click arriving within 150 ms on the same cell (double-click guard). | S |

### 3.3 End-of-round detection
| ID | Requirement | Priority |
|---|---|---|
| FR-14 | After each move the app shall evaluate the board and, if a line is complete, transition to state `WON`, announce the winner, and highlight the winning line. | M |
| FR-15 | If the 9th cell is filled with no completed line, the app shall transition to state `DRAW` and announce a draw. | M |
| FR-16 | The winning-line highlight shall persist until the round is reset and shall not rely on colour alone (also use a border/underline pattern or icon). | M |
| FR-17 | In states `WON` / `DRAW` all cells shall be non-interactive (disabled) until a reset. | M |
| FR-18 | Only one winning line highlight shall be shown even if a move creates two lines simultaneously (highlight all lines, or the first detected — must be documented and consistent). | S |

### 3.4 Match control
| ID | Requirement | Priority |
|---|---|---|
| FR-19 | "New round" button shall clear the board and start a fresh round, keeping the match score. | M |
| FR-20 | "Reset match" button shall clear the board **and** the score, after a confirmation (undoable toast or native confirm). | S |
| FR-21 | "Undo" button shall revert the last move (in 2-player mode: one move; vs computer: the last pair of moves). Disabled when no move exists. | S |
| FR-22 | Score panel shall display: `X` wins, `O` wins, Draws, and total rounds played. | M |
| FR-23 | On reaching a terminal state the app shall automatically start the next round after ≥ 1.2 s **only if** auto-play-next is enabled; default is manual. | C |

### 3.5 Persistence
| ID | Requirement | Priority |
|---|---|---|
| FR-24 | Board, turn, state and score shall be saved to `localStorage` after every state change. | S |
| FR-25 | On load the app shall restore the saved round; if the saved data is missing, malformed or fails validation, it shall silently start a new round. | S |
| FR-26 | The app shall work identically when `localStorage` is unavailable (private mode / quota error) — persistence failures must never break gameplay. | M |

---

## 4. Game Logic Rules (normative)

1. Board is an array of 9 values: `'X' | 'O' | null`.
2. Legal move: `state === 'IN_PROGRESS' && board[index] === null && 0 <= index <= 8`.
3. Win check: exists `L` in `LINES` such that `board[L[0]] === board[L[1]] === board[L[2]] !== null`. Winner = that mark.
4. Draw: `board.every(c => c !== null)` and no win.
5. Evaluation order: **win check first**, then draw check (a winning 9th move is a win, not a draw).
6. Terminal states (`WON`, `DRAW`) accept no further moves.
7. Game logic shall be a **pure function set** with no DOM access:
   - `createGame(startingMark) -> GameState`
   - `applyMove(state, index, now) -> { state, event }` (returns original state + rejection event if illegal)
   - `evaluate(board) -> { status: 'IN_PROGRESS' | 'WON' | 'DRAW', winner, winningLine }`
   - `isDraw(board) -> boolean`

### 4.1 State machine
```
IDLE ──startRound()──▶ IN_PROGRESS ──win──▶ WON ──┐
   ▲                        │ draw                ├──newRound()──▶ IN_PROGRESS
   └─────────resetMatch()───┴─────────────────────┘
```
Illegal transitions shall be rejected and logged (no silent corruption).

---

## 5. User Interface

### 5.1 Layout (single view, mobile-first)
```
┌────────────────────────────────────┐
│  Tic-Tac-Toe            [theme] [?]│  Header
├────────────────────────────────────┤
│  Status: "X to move"               │  Live region
│  Mode: 2 Players   [New round]     │  Controls
├────────────────────────────────────┤
│   ┌───┬───┬───┐                    │
│   │   │   │   │                    │
│   ├───┼───┼───┤   3 × 3 board      │
│   │   │   │   │   (buttons)        │
│   ├───┼───┼───┤                    │
│   │   │   │   │                    │
│   └───┴───┴───┘                    │
├────────────────────────────────────┤
│  Score   X: 2   O: 1   Draws: 1    │  Scoreboard
│  [Undo] [Reset match] [Mode ▾]     │
└────────────────────────────────────┘
```

### 5.2 Components
| Component | Behaviour |
|---|---|
| Board | `role="grid"`, 9 children `role="gridcell"` each implemented as a real `<button>` element (native focus + keyboard). |
| Cell | Square aspect ratio 1:1, min hit area **44 × 44 px**, mark centred, `aria-label` describing coordinates and content (e.g. *"Cell row 2 column 3, empty"*, *"Cell row 1 column 1, X"*). |
| Status line | `aria-live="polite"`, announces turn, win, draw. Never used for hover hints. |
| Scoreboard | Static table/list; updated numbers are also announced via a polite live region only on score change. |
| Controls | Visible focus ring (≥ 3 px outline, ≥ 3:1 contrast), `:hover` and `:active` states. |
| Winner banner | Appears in place of/next to status line; includes a non-colour cue (trophy icon or text "Winner: X"). |

### 5.3 Visual rules
- Marks: `X` and `O` distinguishable by shape (never by colour only) and ≥ 24 px glyph size at the smallest supported viewport.
- Responsive breakpoints: ≥ 1024 px centred card (max-width ≈ 480 px); 640–1023 px fluid; < 640 px full-width board, controls stacked, no horizontal scroll ever.
- Support viewport widths from **320 px** to **2560 px** without layout breakage; support landscape and portrait.
- Light and dark theme (`prefers-color-scheme`), with a manual toggle persisted in `localStorage`.
- Respect `prefers-reduced-motion`: disable all animations/transitions > 100 ms.
- Text resizes correctly at 200 % browser zoom without content loss or clipping.

---

## 6. Optional Feature — Computer Opponent (v1.0 stretch, flag `ENABLE_AI`)

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | Level **Easy**: pick a random legal cell. | C |
| AI-02 | Level **Normal**: win if possible → block an immediate threat → take a corner → centre → any legal cell. | C |
| AI-03 | Level **Hard** (optional): minimax, perfect play; the computer shall be unbeatable (best case for the human is a draw). | C |
| AI-04 | Computer move shall appear after a 250–600 ms simulated delay with a "Computer is thinking…" status; UI must remain responsive. | C |
| AI-05 | Computer moves shall be produced by a pure function `chooseMove(board, player, level) -> index` with no DOM or timer access. | C |
| AI-06 | No network call is permitted for AI moves — logic is fully client-side. | M (when feature is on) |

---

## 7. Technical Specification

### 7.1 Constraints
- Runs in the browser with **no build step required** and **no server-side code**; static files only (must work from `file://` and from any static host).
- Vanilla HTML + CSS + modern JavaScript (ES2020+ modules). If a framework is preferred, React or Svelte is acceptable but must not be required to run the MVP.
- Zero runtime dependencies; dev dependencies only (test runner, linter).
- No network requests at runtime (no CDN assets; fonts/icons are local or system fonts).

### 7.2 Suggested file structure
```
test/
├── index.html
├── styles.css
├── src/
│   ├── main.js          # bootstrap, event wiring
│   ├── game.js          # pure rules engine (no DOM)
│   ├── ui.js            # rendering, DOM updates
│   ├── storage.js       # localStorage adapter (safe wrapper)
│   └── ai.js            # optional opponent
└── tests/
    ├── game.test.js
    └── ai.test.js
```

### 7.3 Data model
```js
GameState = {
  version: 1,
  board: Array(9).fill(null),          // 'X' | 'O' | null
  status: 'IN_PROGRESS'|'WON'|'DRAW',
  winner: 'X'|'O'|null,
  winningLine: number[]|null,          // e.g. [0,4,8]
  currentTurn: 'X'|'O',
  startingMark: 'X',
  moves: number[],                     // history, for undo
  mode: 'pvp'|'cpu',
  score: { X: 0, O: 0, draws: 0 },
  roundsPlayed: 0,
  updatedAt: string                    // ISO-8601
}
```
Storage key: `ttt:v1:state`. Write-through with `try/catch`; on schema mismatch (`version` !== 1) discard and start fresh.

### 7.4 Browser support
Latest two versions of Chrome, Edge, Firefox and Safari; last is not required for IE11 (explicitly unsupported). Degrade gracefully to a playable board without animations on older engines.

---

## 8. Accessibility (WCAG 2.2 Level AA target)
- **A-01** All interactive elements keyboard reachable and operable; logical tab order; no keyboard trap.
- **A-02** Focus always visible; focus never lost after a move (focus stays on the committed cell).
- **A-03** Status changes announced via `aria-live="polite"`; win/draw via `role="status"`.
- **A-04** Colour contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components/marks.
- **A-05** Meaningful `alt`/`aria-label` on cells; board exposes row/column structure.
- **A-06** Works with forced colours / Windows High Contrast mode.
- **A-07** Motion is optional and disabled under `prefers-reduced-motion`.
- **A-08** Document title, `lang` attribute and one `<h1>` present.

---

## 9. Non-functional Requirements
| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Move feedback latency | ≤ 100 ms perceived (no blocking work on the main thread) |
| NFR-02 | First interaction (time to playable board) | ≤ 1 s on a mid-range mobile over a warm cache; total payload ≤ 100 KB uncompressed |
| NFR-03 | Determinism | Same move sequence ⇒ same outcome and same saved state, byte-for-byte |
| NFR-04 | Reliability | No uncaught console errors during a full session; illegal input never throws |
| NFR-05 | Test coverage | 100 % of rules-engine branches; all 8 win lines covered |
| NFR-06 | Maintainability | Rules engine has 0 DOM references; ESLint clean; no `eval`, no inline handlers |
| NFR-07 | Security | No third-party code; user data never leaves the device. Sanitize any injected DOM content (none expected) |
| NFR-08 | Privacy | No cookies required, no tracking, no analytics |
| NFR-09 | i18n readiness | All user-facing strings in a single `STRINGS` map; default `en`, easy to add more |
| NFR-10 | Offline | Fully playable offline once loaded |

---

## 10. Edge Cases (must be handled)
1. Rapid double-click on the same cell → exactly one move.
2. Click on an occupied cell → ignored, no turn switch.
3. Page reload mid-round → state restored exactly (§ FR-24/25).
4. Corrupted or hand-edited `localStorage` value → fresh round, no crash.
5. `localStorage` blocked (Safari private mode) → gameplay unaffected.
6. Undo pressed when history is empty → button disabled (not an error).
7. Reset pressed during a finished round → score zeroed, board cleared, `X` starts.
8. Two winning lines created by one move → handled per FR-18, no double score increment.
9. Extremely narrow viewport (320 px) or 200 % zoom → board remains fully usable.
10. Keyboard `Tab` through all 9 cells then controls → focus ring visible at every step.
11. Score must never go negative, even with tampered storage.
12. Computer mode: user clicks during "thinking" delay → ignored until the human's turn resumes.

---

## 11. Acceptance Criteria (MVP)
- [ ] AC-1 A new visitor can play a complete round in both players mode without instructions.
- [ ] AC-2 All 8 winning lines are detected and highlighted; a full non-winning board reports a draw.
- [ ] AC-3 Occupied cells and post-game cells cannot alter the game.
- [ ] AC-4 The turn always alternates and the status line is always accurate.
- [ ] AC-5 Score persists across rounds and reloads; reset zeroes it.
- [ ] AC-6 New round starts a clean board in ≤ 100 ms.
- [ ] AC-7 Playable with keyboard only and announced correctly to a screen reader.
- [ ] AC-8 No layout breakage at 320 px, 768 px and 1440 px widths, light or dark theme.
- [ ] AC-9 Unit tests for the rules engine pass; coverage report shows all lines win-tested.
- [ ] AC-10 App loads and runs from `file://index.html` with no console errors.

---

## 12. Test Plan Summary
| Type | Focus |
|---|---|
| Unit (rules) | `applyMove`, `evaluate`, `isDraw`, undo, score invariants; every winning line; win-on-last-move; illegal move rejection. |
| Unit (AI) | Easy returns only legal cells; Normal always blocks a two-in-a-row threat; Hard never loses (exhaustive or sampled 5 000 games). |
| Integration | UI click → engine → render → storage round-trip; reload restores state. |
| E2E (optional, Playwright) | Full X-win round, draw round, reset match, keyboard-only round. |
| Manual/Accessibility | Tab-order walkthrough, NVDA/VoiceOver smoke test, 200 % zoom, reduced motion, contrast audit. |

Representative unit cases:
| # | Board (input) | Expected |
|---|---|---|
| T1 | empty + `X` at 4 | `X` placed, turn → `O`, `IN_PROGRESS` |
| T2 | `X` at 0, turn `O` + `O` at 0 | rejected `CELL_OCCUPIED`, state unchanged |
| T3 | `X`:0,4 + `X`:8 | `WON`, winner `X`, line `[0,4,8]` |
| T4 | board full, no line | `DRAW` |
| T5 | board full, `X` completes line on 9th move | `WON` (not draw) |
| T6 | `X` at 0, `X` at 1, turn `X` | impossible state → treated as new round |

---

## 13. Deliverables
1. `index.html`, `styles.css`, `src/*.js`.
2. `tests/*` with a `npm test` script.
3. `README.md` — how to run (open `index.html` or `npx serve .`), how to test, how to toggle `ENABLE_AI`.
4. This specification, updated if scope changes.

---

## 14. Assumptions & Open Questions
**Assumptions**
- Single-device, single-browser usage; no user identity needed.
- English only for v1.0; no date/time features beyond an internal timestamp.
- Static hosting is available for deployment, though `file://` support is required.

**Open questions**
1. Is the computer opponent required for the v1.0 release, or a fast-follow?
2. Should "alternate starting mark each round" be the default (fairer) instead of "`X` always starts"?
3. Is an offline PWA install wanted in v1.1?
4. Preferred stack confirmation: vanilla JS (recommended) vs framework?
5. Any branding requirements (colours, logo, typography) for the Test project?

---

## 15. Change Log
| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-03-18 | Spec draft (assistant) | Initial generic specification for the browser Tic-Tac-Toe web app. |
