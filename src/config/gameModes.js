// Game Modes | Central rules for every playable mode
export const HINT_DEFINITIONS = Object.freeze({
  platform: Object.freeze({ id: 'platform', label: 'Platform', penalty: 100 }),
  developer: Object.freeze({ id: 'developer', label: 'Developer', penalty: 150 }),
  decade: Object.freeze({ id: 'decade', label: 'Decade', penalty: 250 })
})

export const GAME_MODES = Object.freeze({
  classic: Object.freeze({
    id: 'classic',
    name: 'Classic',
    shortDescription: 'Ten untimed trips through gaming history.',
    roundLimit: 10,
    timerSeconds: 0,
    startingLives: 0,
    hints: ['platform', 'developer', 'decade'],
    requiresDecade: false,
    deterministic: false,
    compactFeedback: false,
    autoAdvanceMs: 0
  }),
  timeAttack: Object.freeze({
    id: 'timeAttack',
    name: 'Time Attack',
    shortDescription: 'Score as much as possible before 120 seconds expire.',
    roundLimit: 0,
    timerSeconds: 120,
    startingLives: 0,
    hints: [],
    requiresDecade: false,
    deterministic: false,
    compactFeedback: true,
    autoAdvanceMs: 1000
  }),
  survival: Object.freeze({
    id: 'survival',
    name: 'Survival',
    shortDescription: 'Ten rounds, three lives, and no mercy below 400 points.',
    roundLimit: 10,
    timerSeconds: 0,
    startingLives: 3,
    hints: ['platform', 'developer', 'decade'],
    requiresDecade: false,
    deterministic: false,
    compactFeedback: false,
    autoAdvanceMs: 0
  }),
  decade: Object.freeze({
    id: 'decade',
    name: 'Decade Challenge',
    shortDescription: 'Ten games pulled from one eligible decade.',
    roundLimit: 10,
    timerSeconds: 0,
    startingLives: 0,
    hints: ['platform', 'developer'],
    requiresDecade: true,
    deterministic: false,
    compactFeedback: false,
    autoAdvanceMs: 0
  }),
  daily: Object.freeze({
    id: 'daily',
    name: 'Daily Challenge',
    shortDescription: 'The same ten-game lineup for everyone today.',
    roundLimit: 10,
    timerSeconds: 0,
    startingLives: 0,
    hints: [],
    requiresDecade: false,
    deterministic: true,
    compactFeedback: false,
    autoAdvanceMs: 0
  })
})

export const MODE_ORDER = Object.freeze([
  'classic',
  'timeAttack',
  'survival',
  'decade',
  'daily'
])

export function getGameMode(modeId = 'classic') {
  return GAME_MODES[modeId] || GAME_MODES.classic
}

export function getModeMaxScore(modeId, roundsCompleted = 0) {
  const mode = getGameMode(modeId)
  const rounds = mode.roundLimit || roundsCompleted
  return Math.max(0, rounds) * 1000
}
