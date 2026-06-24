// Online Run Payload | Converts current Vuex run state into stable score submission data
import { getModeMaxScore } from '../config/gameModes.js'

export function createClientRunId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const randomPart = Math.random().toString(16).slice(2)
  const timePart = Date.now().toString(16)
  return `${timePart.slice(-8)}-${randomPart.slice(0, 4)}-4${randomPart.slice(4, 7)}-8${randomPart.slice(7, 10)}-${randomPart.slice(10, 22).padEnd(12, '0')}`
}

function sanitizeRoundResult(result) {
  return {
    game_key: String(result.gameKey || ''),
    game_title: String(result.gameTitle || ''),
    selected_year: Number(result.selectedYear || 0),
    correct_year: Number(result.correctYear || 0),
    difference: Number(result.difference || 0),
    base_score: Number(result.baseScore || 0),
    score: Number(result.score || 0),
    score_ceiling: Number(result.scoreCeiling || 1000),
    used_hints: Array.isArray(result.usedHints) ? result.usedHints : [],
    streak: Number(result.streak || 0),
    life_lost: Boolean(result.lifeLost)
  }
}

export function buildOnlineRunPayload(state) {
  const results = Array.isArray(state.roundResults) ? state.roundResults : []

  if (!state.clientRunId || !results.length || state.runStatus !== 'complete') {
    return null
  }

  const distanceTotal = results.reduce((sum, result) => sum + Number(result.difference || 0), 0)
  const roundsCompleted = results.length
  const maxScore = Math.max(
    Number(state.totalScore || 0),
    getModeMaxScore(state.selectedMode, roundsCompleted) || roundsCompleted * 1000,
    1
  )

  return {
    clientRunId: state.clientRunId,
    mode: state.selectedMode,
    score: Number(state.totalScore || 0),
    maxScore,
    roundsCompleted,
    averageYearError: Number((distanceTotal / roundsCompleted).toFixed(2)),
    bestStreak: Number(state.bestStreak || 0),
    selectedDecade: state.selectedMode === 'decade' ? Number(state.selectedDecade) : null,
    dailyDate: state.selectedMode === 'daily' ? state.dailyDateKey : null,
    roundData: results.map(sanitizeRoundResult),
    clientVersion: '1.0.0'
  }
}
