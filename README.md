# Tic-Tac-Toe in teh style of War Games (1983) movie -Web Application

A browser-playable implementation of the classic Tic-Tac-Toe (noughts and crosses) game. Built with vanilla HTML, CSS, and JavaScript.
This is a tiny - creepy - crappy test for trying out Qwen models doing SSD on my workstation. Do not expect something decent here. Just measuring performance and reasoning levels

## Features

- **3x3 board** with two-player local hot-seat mode
- **Computer opponent** with 3 difficulty levels (Easy, Normal, Hard)
- **Turn enforcement** and win/draw detection
- **Score tracking** across rounds with localStorage persistence
- **Undo** last move
- **Light/Dark theme** toggle
- **Full keyboard** and mouse/touch support
- **Screen reader** accessibility (ARIA live regions)
- **Responsive design** — works from 320px to 1440px+ viewports
- **State persistence** — game state survives page reloads

## Quick Start

### Option 1: Open directly

Simply open `index.html` in any modern browser.

### Option 2: Local server

```bash
npx serve .
```

## Testing

```bash
npm test
```

## Project Structure

```
Test/
├── index.html          # Entry point
├── styles.css          # All styling
├── src/
│   ├── engine.js       # Game rules engine
│   ├── ai.js           # Computer opponent
│   ├── ui.js           # UI controller
│   └── storage.js      # localStorage persistence
├── tests/
│   ├── engine.test.js
│   └── ai.test.js
├── package.json
└── README.md
```

## How to Play

### Two Player Mode

1. Player X goes first by default
2. Click/tap a cell to place your mark
3. First to get 3 in a row wins
4. Full board with no winner = draw

### Computer Opponent

1. Select: Easy (random), Normal (strategic), Hard (unbeatable)
2. Play as X against the computer
3. AI responds after short thinking delay

## Settings

- **Opponent**: 2 Players or Computer (Easy/Normal/Hard)
- **Start Mark**: X always, O always, or alternate

## AI Algorithms

| Level | Algorithm | Description |
|-------|-----------|-------------|
| Easy | Random | Random legal move |
| Normal | Minimax (depth 4) | Strategic with alpha-beta pruning |
| Hard | Minimax (unlimited) | Optimal play — never loses |

## Persistence

Scores and settings stored in `localStorage`:

- `ttt_scores`: `{ xWins, oWins, draws }`
- `ttt_settings`: `{ startMark, opponent }`
- `ttt_theme`: `"light"` or `"dark"`
- `ttt_game_state`: Current game state

## Browser Support

Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## Accessibility

- Full keyboard navigation
- Screen reader announcements (`aria-live`)
- High contrast mode support
- Reduced motion support
- Semantic HTML with ARIA roles

## License

MIT