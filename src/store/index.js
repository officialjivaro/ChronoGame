import { createStore } from 'vuex'
import cosmetics from './modules/cosmetics.js'
import economy from './modules/economy.js'
import online from './modules/online.js'
import { GAME_MODES, getGameMode } from '../config/gameModes.js'
import { getUtcDateKey, getPreviousUtcDateKey } from '../utils/dailyChallenge.js'
import {
  createRunSelection,
  getDecadeAvailability,
  getGameKey,
  takeReplacementGame
} from '../utils/gameSelection.js'
import {
  createRoundScoreResult,
  getAccuracyFeedback,
  getHintScoreCeiling
} from '../utils/scoring.js'
import { createClientRunId } from '../utils/onlineRunPayload.js'
import {
  getDailyResult,
  loadPlayerStats,
  recordCompletedRun
} from '../utils/storage.js'

const GAME_DATA_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

async function loadGameDataFile(letter) {
  const filePath = `./data/games/games_${letter}.json`
  const response = await fetch(filePath)

  if (!response.ok) {
    throw new Error(`Unable to load ${filePath} (${response.status}).`)
  }

  const games = await response.json()

  if (!Array.isArray(games)) {
    throw new Error(`${filePath} must contain a JSON array.`)
  }

  const misplacedGame = games.find((game) => {
    const firstLetter = game?.title?.trim().match(/[a-z]/i)?.[0]?.toLowerCase()
    return firstLetter !== letter
  })

  if (misplacedGame) {
    throw new Error(`${misplacedGame.title || 'A game'} is stored in the wrong letter file.`)
  }

  return games
}

function getInitialRunState() {
  return {
    clientRunId: '',
    selectedMode: 'classic',
    selectedDecade: null,
    currentRound: 0,
    selectedGames: [],
    reserveGames: [],
    totalScore: 0,
    maxRounds: 10,
    roundResults: [],
    currentStreak: 0,
    bestStreak: 0,
    lives: 0,
    remainingSeconds: 0,
    runStatus: 'idle',
    usedHints: [],
    roundScoreCeiling: 1000,
    dailyDateKey: '',
    dailyPractice: false,
    dailyOfficialRecorded: false,
    imageReady: false,
    resultsRecorded: false
  }
}

export default createStore({
  modules: {
    cosmetics,
    economy,
    online
  },
  state: {
    games: [],
    previousGameKeys: [],
    playerStats: loadPlayerStats(),
    ...getInitialRunState()
  },
  getters: {
    activeMode(state) {
      return getGameMode(state.selectedMode)
    },
    currentGame(state) {
      return state.selectedGames[state.currentRound] || null
    },
    decadeAvailability(state) {
      return getDecadeAvailability(state.games, 10)
    },
    eligibleDecades(state, getters) {
      return getters.decadeAvailability.filter((item) => item.eligible)
    },
    currentScoreCeiling(state) {
      return getHintScoreCeiling(state.usedHints)
    },
    completedRounds(state) {
      return state.roundResults.length
    }
  },
  mutations: {
    setGames(state, payload) {
      state.games = payload
    },
    setPlayerStats(state, payload) {
      state.playerStats = payload
    },
    setPreviousGameKeys(state, payload) {
      state.previousGameKeys = Array.isArray(payload) ? payload : []
    },
    configureRun(state, payload) {
      Object.assign(state, getInitialRunState(), payload)
    },
    setSelectedGames(state, payload) {
      state.selectedGames = Array.isArray(payload) ? payload : []
    },
    setReserveGames(state, payload) {
      state.reserveGames = Array.isArray(payload) ? payload : []
    },
    setRunStatus(state, payload) {
      state.runStatus = payload
    },
    setRemainingSeconds(state, payload) {
      state.remainingSeconds = Math.max(0, Number(payload) || 0)
    },
    setImageReady(state, payload) {
      state.imageReady = Boolean(payload)
    },
    addHint(state, hintId) {
      if (!state.usedHints.includes(hintId)) {
        state.usedHints.push(hintId)
        state.roundScoreCeiling = getHintScoreCeiling(state.usedHints)
      }
    },
    recordRound(state, result) {
      state.roundResults.push(result)
      state.totalScore += result.score
      state.currentStreak = result.streak
      state.bestStreak = Math.max(state.bestStreak, result.streak)
      state.lives = result.livesRemaining
    },
    advanceRound(state) {
      state.currentRound += 1
      state.usedHints = []
      state.roundScoreCeiling = 1000
      state.imageReady = false
    },
    replaceCurrentGame(state, payload) {
      state.selectedGames = payload.selectedGames
      state.reserveGames = payload.reserveGames
      state.usedHints = []
      state.roundScoreCeiling = 1000
      state.imageReady = false
    },
    setResultsRecorded(state, payload) {
      state.resultsRecorded = true
      state.dailyOfficialRecorded = Boolean(payload?.dailyOfficialRecorded)
    },
    resetGame(state) {
      const previous = state.selectedGames.slice(0, state.maxRounds).map(getGameKey).filter(Boolean)
      Object.assign(state, getInitialRunState())
      state.previousGameKeys = previous.length ? previous : state.previousGameKeys
    }
  },
  actions: {
    async loadGames({ state, commit }) {
      if (state.games.length >= 10) {
        return state.games
      }

      const gameGroups = await Promise.all(GAME_DATA_LETTERS.map(loadGameDataFile))
      const data = gameGroups
        .flat()
        .sort((first, second) => first.title.localeCompare(second.title, undefined, { sensitivity: 'base' }))

      if (data.length < 10) {
        throw new Error('The combined game files must contain at least ten entries.')
      }

      const invalidGame = data.find((game) => {
        return !game?.title ||
          !game?.developer ||
          !game?.publisher ||
          !Number.isInteger(game?.year) ||
          !Array.isArray(game?.platforms) ||
          !game.platforms.length ||
          !game?.facts ||
          !game?.imageUrl
      })

      if (invalidGame) {
        throw new Error(`Game data is incomplete for ${invalidGame.title || 'an unknown entry'}.`)
      }

      const gameKeys = new Set()
      const duplicateGame = data.find((game) => {
        const key = `${game.title.trim().toLowerCase()}::${game.year}`

        if (gameKeys.has(key)) {
          return true
        }

        gameKeys.add(key)
        return false
      })

      if (duplicateGame) {
        throw new Error(`Duplicate game data found for ${duplicateGame.title} (${duplicateGame.year}).`)
      }

      commit('setGames', data)
      return data
    },
    loadPlayerStats({ commit }) {
      const stats = loadPlayerStats()
      commit('setPlayerStats', stats)
      return stats
    },
    async startRun({ state, dispatch, commit }, { modeId = 'classic', decade = null } = {}) {
      await dispatch('loadGames')
      await dispatch('online/resetScoreSaveStatus')
      const stats = await dispatch('loadPlayerStats')
      const mode = GAME_MODES[modeId]

      if (!mode) {
        throw new Error('That game mode is not available.')
      }

      if (mode.requiresDecade) {
        const available = getDecadeAvailability(state.games, mode.roundLimit)
          .find((item) => item.decade === Number(decade))

        if (!available?.eligible) {
          throw new Error('That decade does not have enough games for a ten-round run.')
        }
      }

      const previousKeys = state.selectedGames
        .slice(0, state.maxRounds)
        .map(getGameKey)
        .filter(Boolean)

      if (previousKeys.length) {
        commit('setPreviousGameKeys', previousKeys)
      }

      const dailyDateKey = modeId === 'daily' ? getUtcDateKey() : ''
      const dailyPractice = modeId === 'daily' && Boolean(getDailyResult(stats, dailyDateKey))
      const selection = createRunSelection({
        games: state.games,
        modeId,
        count: mode.roundLimit || state.games.length,
        decade: mode.requiresDecade ? Number(decade) : null,
        previousGameKeys: state.previousGameKeys,
        recentGameKeys: stats.recentGameKeys,
        dailyDateKey
      })

      const requiredCount = mode.roundLimit || 1

      if (selection.selected.length < requiredCount) {
        throw new Error(`Not enough eligible games are available for ${mode.name}.`)
      }

      commit('configureRun', {
        clientRunId: createClientRunId(),
        selectedMode: modeId,
        selectedDecade: mode.requiresDecade ? Number(decade) : null,
        maxRounds: mode.roundLimit || selection.selected.length,
        lives: mode.startingLives,
        remainingSeconds: mode.timerSeconds,
        runStatus: 'playing',
        dailyDateKey,
        dailyPractice
      })
      commit('setSelectedGames', selection.selected)
      commit('setReserveGames', selection.reserve)

      return selection.selected
    },
    useHint({ state, getters, commit }, hintId) {
      const mode = getters.activeMode

      if (state.runStatus !== 'playing' || !mode.hints.includes(hintId) || state.usedHints.includes(hintId)) {
        return false
      }

      commit('addHint', hintId)
      return true
    },
    setImageReady({ commit }, ready) {
      commit('setImageReady', ready)
    },
    submitRound({ state, getters, commit }, selectedYear) {
      if (state.runStatus !== 'playing' || !state.imageReady) {
        throw new Error('The current image is not ready for scoring.')
      }

      const game = getters.currentGame

      if (!game) {
        throw new Error('No game is available for this round.')
      }

      const scored = createRoundScoreResult(selectedYear, game.year, state.usedHints)
      const accuracy = getAccuracyFeedback(scored.difference)
      const streak = scored.score >= 700 ? state.currentStreak + 1 : 0
      const survivalLifeLost = state.selectedMode === 'survival' && scored.score < 400
      const livesRemaining = survivalLifeLost ? Math.max(0, state.lives - 1) : state.lives
      const result = {
        ...scored,
        gameKey: getGameKey(game),
        gameTitle: game.title,
        accuracyLabel: accuracy.label,
        accuracyMessage: accuracy.message,
        streak,
        lifeLost: survivalLifeLost,
        livesRemaining,
        factsUnlocked: scored.score >= 400
      }

      commit('recordRound', result)
      return result
    },
    advanceRound({ state, commit }) {
      const reachedLifeLimit = state.selectedMode === 'survival' && state.lives <= 0
      const reachedQueueEnd = state.currentRound + 1 >= state.selectedGames.length
      const timerExpired = state.selectedMode === 'timeAttack' && state.remainingSeconds <= 0

      if (reachedLifeLimit || reachedQueueEnd || timerExpired) {
        commit('setRunStatus', 'complete')
        return { complete: true }
      }

      commit('advanceRound')
      return { complete: false }
    },
    finishRun({ commit }) {
      commit('setRunStatus', 'complete')
    },
    updateTimer({ commit }, seconds) {
      commit('setRemainingSeconds', seconds)
    },
    replaceCurrentGame({ state, commit }) {
      const replacement = takeReplacementGame({
        reserveGames: state.reserveGames,
        selectedGames: state.selectedGames,
        currentRound: state.currentRound
      })

      if (!replacement.replacement) {
        throw new Error('No unused replacement game is available.')
      }

      const selectedGames = [...replacement.selected]
      selectedGames[state.currentRound] = replacement.replacement
      commit('replaceCurrentGame', {
        selectedGames,
        reserveGames: replacement.reserve
      })

      return replacement.replacement
    },
    finalizeRun({ state, commit }) {
      if (state.resultsRecorded) {
        return {
          stats: state.playerStats,
          dailyOfficialRecorded: state.dailyOfficialRecorded
        }
      }

      const recorded = recordCompletedRun(state.playerStats, {
        modeId: state.selectedMode,
        totalScore: state.totalScore,
        roundResults: state.roundResults,
        bestStreak: state.bestStreak,
        gameKeys: state.roundResults.map((result) => result.gameKey),
        dateKey: state.dailyDateKey,
        previousDateKey: state.dailyDateKey ? getPreviousUtcDateKey(state.dailyDateKey) : ''
      })

      commit('setPlayerStats', recorded.stats)
      commit('setResultsRecorded', recorded)
      return recorded
    },
    restartRun({ state, dispatch }) {
      return dispatch('startRun', {
        modeId: state.selectedMode,
        decade: state.selectedDecade
      })
    }
  }
})
