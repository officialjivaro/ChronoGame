// Player Storage | Safely persists lightweight local progress
const STORAGE_KEY = 'chronogame-player-data-v1'
const STORAGE_VERSION = 1
const RECENT_GAME_LIMIT = 30
const DAILY_RESULT_LIMIT = 120

function getDefaults() {
  return {
    version: STORAGE_VERSION,
    classicBestScore: 0,
    totalYearDistance: 0,
    totalGuesses: 0,
    bestAccuracyStreak: 0,
    recentGameKeys: [],
    dailyResultsByDate: {},
    dailyStreak: 0,
    lastDailyCompletionDate: ''
  }
}

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadPlayerStats() {
  const storage = getStorage()

  if (!storage) {
    return getDefaults()
  }

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || 'null')

    if (!parsed || parsed.version !== STORAGE_VERSION) {
      return getDefaults()
    }

    return {
      ...getDefaults(),
      ...parsed,
      recentGameKeys: Array.isArray(parsed.recentGameKeys) ? parsed.recentGameKeys : [],
      dailyResultsByDate: parsed.dailyResultsByDate && typeof parsed.dailyResultsByDate === 'object'
        ? parsed.dailyResultsByDate
        : {}
    }
  } catch {
    return getDefaults()
  }
}

export function savePlayerStats(stats) {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...stats, version: STORAGE_VERSION }))
    return true
  } catch {
    return false
  }
}

function uniqueRecentKeys(currentKeys, previousKeys) {
  return [...new Set([...currentKeys, ...previousKeys])].slice(0, RECENT_GAME_LIMIT)
}

function trimDailyResults(results) {
  const keys = Object.keys(results).sort().slice(-DAILY_RESULT_LIMIT)
  return keys.reduce((trimmed, key) => {
    trimmed[key] = results[key]
    return trimmed
  }, {})
}

export function getDailyResult(stats, dateKey) {
  return stats?.dailyResultsByDate?.[dateKey] || null
}

export function recordCompletedRun(stats, run) {
  const next = {
    ...getDefaults(),
    ...stats,
    dailyResultsByDate: { ...stats?.dailyResultsByDate }
  }

  const results = Array.isArray(run.roundResults) ? run.roundResults : []
  const distanceTotal = results.reduce((sum, result) => sum + Number(result.difference || 0), 0)

  next.totalYearDistance += distanceTotal
  next.totalGuesses += results.length
  next.bestAccuracyStreak = Math.max(next.bestAccuracyStreak, Number(run.bestStreak || 0))
  next.recentGameKeys = uniqueRecentKeys(run.gameKeys || [], next.recentGameKeys)

  if (run.modeId === 'classic') {
    next.classicBestScore = Math.max(next.classicBestScore, Number(run.totalScore || 0))
  }

  let dailyOfficialRecorded = false

  if (run.modeId === 'daily' && run.dateKey && !next.dailyResultsByDate[run.dateKey]) {
    next.dailyResultsByDate[run.dateKey] = {
      score: Number(run.totalScore || 0),
      completedAt: new Date().toISOString()
    }

    const previousDate = run.previousDateKey
    next.dailyStreak = next.lastDailyCompletionDate === previousDate
      ? next.dailyStreak + 1
      : 1
    next.lastDailyCompletionDate = run.dateKey
    next.dailyResultsByDate = trimDailyResults(next.dailyResultsByDate)
    dailyOfficialRecorded = true
  }

  savePlayerStats(next)

  return {
    stats: next,
    dailyOfficialRecorded
  }
}

export function getAverageYearsOff(stats) {
  const guesses = Number(stats?.totalGuesses || 0)
  return guesses > 0 ? Number(stats.totalYearDistance || 0) / guesses : 0
}
