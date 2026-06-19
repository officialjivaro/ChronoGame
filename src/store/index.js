import { createStore } from 'vuex'
import { selectUniqueGames } from '../utils/gameSelection.js'

const gameDataSources = [
  './data/games.json',
  './data/games-additions.json'
]

export default createStore({
  state: {
    games: [],
    currentRound: 0,
    selectedGames: [],
    previousSelectedGames: [],
    totalScore: 0,
    maxRounds: 5
  },
  mutations: {
    setGames(state, payload) {
      state.games = payload
    },
    setSelectedGames(state, payload) {
      state.selectedGames = payload
    },
    incrementRound(state) {
      state.currentRound += 1
    },
    resetGame(state) {
      if (state.selectedGames.length) {
        state.previousSelectedGames = [...state.selectedGames]
      }

      state.currentRound = 0
      state.totalScore = 0
      state.selectedGames = []
    },
    addScore(state, payload) {
      state.totalScore += payload
    }
  },
  actions: {
    async loadGames({ commit }) {
      const responses = await Promise.all(
        gameDataSources.map((source) => fetch(source))
      )

      const failedResponse = responses.find((response) => !response.ok)

      if (failedResponse) {
        throw new Error(`Unable to load game data (${failedResponse.status}).`)
      }

      const gameLists = await Promise.all(
        responses.map((response) => response.json())
      )
      const data = gameLists.flat()

      if (!Array.isArray(data) || data.length < 5) {
        throw new Error('The game list must contain at least five entries.')
      }

      const uniqueKeys = new Set(data.map((game) => `${game.title}::${game.year}`))

      if (uniqueKeys.size !== data.length) {
        throw new Error('The game list contains duplicate title and year entries.')
      }

      commit('setGames', data)
      return data
    },
    selectRandomGames({ state, commit }) {
      const selected = selectUniqueGames(
        state.games,
        state.maxRounds,
        state.previousSelectedGames
      )

      if (selected.length < state.maxRounds) {
        throw new Error('Not enough games are available to start a full run.')
      }

      commit('setSelectedGames', selected)
      return selected
    }
  }
})
