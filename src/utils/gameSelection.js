// Game Selection | Builds fair random, filtered, and deterministic game queues
import { createSeededRandom } from './dailyChallenge.js'

export function getGameKey(game) {
  if (!game || typeof game !== 'object') {
    return ''
  }

  return `${game.title || ''}|${game.year || ''}`
}

export function getGameDecade(game) {
  const year = Number(game?.year)
  return Number.isFinite(year) ? Math.floor(year / 10) * 10 : null
}

export function shuffleGames(games, random = Math.random) {
  const shuffled = [...games]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled
}

export function getDecadeAvailability(games, requiredCount = 10) {
  const counts = new Map()

  for (let decade = 1960; decade <= 2020; decade += 10) {
    counts.set(decade, 0)
  }

  for (const game of Array.isArray(games) ? games : []) {
    const decade = getGameDecade(game)
    counts.set(decade, (counts.get(decade) || 0) + 1)
  }

  return [...counts.entries()].map(([decade, count]) => ({
    decade,
    count,
    eligible: count >= requiredCount
  }))
}

export function filterGamesForMode(games, modeId, decade = null) {
  const source = Array.isArray(games) ? games : []

  if (modeId === 'decade' && Number.isInteger(decade)) {
    return source.filter((game) => getGameDecade(game) === decade)
  }

  return [...source]
}

function orderWithRecentDeprioritized(games, recentGameKeys, random) {
  const recentSet = new Set(recentGameKeys || [])
  const fresh = []
  const recent = []

  for (const game of games) {
    if (recentSet.has(getGameKey(game))) {
      recent.push(game)
    } else {
      fresh.push(game)
    }
  }

  return [
    ...shuffleGames(fresh, random),
    ...shuffleGames(recent, random)
  ]
}

function getSetKey(games) {
  return games.map(getGameKey).filter(Boolean).sort().join('::')
}

function avoidImmediateRepeat(selected, reserve, previousGameKeys) {
  const previousSetKey = [...(previousGameKeys || [])].filter(Boolean).sort().join('::')

  if (!previousSetKey || getSetKey(selected) !== previousSetKey || !reserve.length) {
    return { selected, reserve }
  }

  const previousSet = new Set(previousGameKeys)
  const replacementIndex = reserve.findIndex((game) => !previousSet.has(getGameKey(game)))

  if (replacementIndex < 0 || !selected.length) {
    return { selected, reserve }
  }

  const nextSelected = [...selected]
  const nextReserve = [...reserve]
  const replacement = nextReserve.splice(replacementIndex, 1)[0]
  nextReserve.push(nextSelected[nextSelected.length - 1])
  nextSelected[nextSelected.length - 1] = replacement

  return {
    selected: shuffleGames(nextSelected),
    reserve: nextReserve
  }
}

export function createRunSelection({
  games,
  modeId,
  count = 10,
  decade = null,
  previousGameKeys = [],
  recentGameKeys = [],
  dailyDateKey = ''
}) {
  const eligible = filterGamesForMode(games, modeId, decade)

  if (!eligible.length) {
    return { selected: [], reserve: [], eligibleCount: 0 }
  }

  let ordered

  if (modeId === 'daily') {
    const random = createSeededRandom(`ChronoGame|${dailyDateKey}`)
    ordered = shuffleGames(
      [...eligible].sort((a, b) => getGameKey(a).localeCompare(getGameKey(b))),
      random
    )
  } else {
    ordered = orderWithRecentDeprioritized(eligible, recentGameKeys, Math.random)
  }

  if (modeId === 'timeAttack') {
    return {
      selected: ordered,
      reserve: [],
      eligibleCount: eligible.length
    }
  }

  const selectionCount = Math.min(count, ordered.length)
  const selected = ordered.slice(0, selectionCount)
  const reserve = ordered.slice(selectionCount)

  if (modeId === 'daily') {
    return { selected, reserve, eligibleCount: eligible.length }
  }

  return {
    ...avoidImmediateRepeat(selected, reserve, previousGameKeys),
    eligibleCount: eligible.length
  }
}

export function takeReplacementGame({ reserveGames, selectedGames, currentRound }) {
  const reserve = Array.isArray(reserveGames) ? [...reserveGames] : []
  const selected = Array.isArray(selectedGames) ? [...selectedGames] : []

  if (reserve.length) {
    return {
      replacement: reserve.shift(),
      selected,
      reserve,
      removeFailed: false
    }
  }

  const nextIndex = currentRound + 1

  if (nextIndex < selected.length) {
    const replacement = selected[nextIndex]
    selected.splice(nextIndex, 1)
    return {
      replacement,
      selected,
      reserve,
      removeFailed: true
    }
  }

  return {
    replacement: null,
    selected,
    reserve,
    removeFailed: false
  }
}
