import { createStore } from 'vuex'
import { selectUniqueGames } from '../utils/gameSelection.js'

export default createStore({
  state: {
    games: [],
    currentRound: 0,
    selectedGames: [],
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
      const response = await fetch('./data/games.json')

      if (!response.ok) {
        throw new Error(`Unable to load game data (${response.status}).`)
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length < 5) {
        throw new Error('The game list must contain at least five entries.')
      }

      commit('setGames', data)
      return data
    },
    selectRandomGames({ state, commit }) {
      const selected = selectUniqueGames(state.games, state.maxRounds)

      if (selected.length < state.maxRounds) {
        throw new Error('Not enough games are available to start a full run.')
      }

      commit('setSelectedGames', selected)
      return selected
    }
  }
})
