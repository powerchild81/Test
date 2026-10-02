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

/**
 * Save match scores to localStorage
 * @param {Object} scores - { xWins, oWins, draws }
 * @returns {boolean}
 */
export function saveScores(scores) {
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

/**
 * Load match scores from localStorage
 * @returns {Object} { xWins, oWins, draws }
 */
export function loadScores() {
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

/**
 * Save settings to localStorage
 * @param {Object} settings - { startMark, opponent }
 * @returns {boolean}
 */
export function saveSettings(settings) {
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

/**
 * Load settings from localStorage
 * @returns {Object} { startMark, opponent }
 */
export function loadSettings() {
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

/**
 * Save theme preference
 * @param {string} theme - 'light' or 'dark'
 * @returns {boolean}
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load theme preference
 * @returns {string} 'light' or 'dark'
 */
export function loadTheme() {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Reset all stored data
 * @returns {boolean}
 */
export function resetAll() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save current game state (optional, for reload persistence)
 * @param {Object} gameState
 * @returns {boolean}
 */
export function saveGameState(gameState) {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load current game state
 * @returns {Object|null}
 */
export function loadGameState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear game state from storage
 * @returns {boolean}
 */
export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    return true;
  } catch {
    return false;
  }
}