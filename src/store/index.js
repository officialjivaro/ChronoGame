import { createStore } from 'vuex'

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
      state.currentRound++
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
      const response = await fetch('/src/data/games.json')
      const data = await response.json()
      commit('setGames', data)
    },
    selectRandomGames({ state, commit }) {
      let shuffled = [...state.games].sort(() => 0.5 - Math.random())
      let selected = shuffled.slice(0, state.maxRounds)
      commit('setSelectedGames', selected)
    }
  }
})
