<template>
  <div class="game-view text-center mt-4">
    <h2>Round {{ currentRound + 1 }}/{{ maxRounds }} - Guess the Release Year</h2>
    <GameImage :key="currentRound" :game="currentGame" />
    <SliderControl :year="selectedYear" @update-year="updateYear" />
    <button
      v-if="!hasSubmitted"
      class="custom-btn mt-3"
      @click="submitGuess"
    >
      Submit
    </button>
    <button
      v-else
      class="custom-btn mt-3"
      @click="goNext"
    >
      Next
    </button>
    <FadeTransition :show="showFacts">
      <ScorePanel
        v-if="showFacts"
        :score="thisRoundScore"
        :game="currentGame"
        @close-panel="closeFacts"
      />
    </FadeTransition>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import GameImage from '../components/GameImage.vue'
import SliderControl from '../components/SliderControl.vue'
import ScorePanel from '../components/ScorePanel.vue'
import FadeTransition from '../components/FadeTransition.vue'
export default {
  name: 'GameView',
  components: {
    GameImage,
    SliderControl,
    ScorePanel,
    FadeTransition
  },
  data() {
    return {
      selectedYear: 2000,
      showFacts: false,
      thisRoundScore: 0,
      hasSubmitted: false
    }
  },
  computed: {
    ...mapState(['selectedGames', 'currentRound', 'maxRounds']),
    currentGame() {
      return this.selectedGames[this.currentRound] || null
    }
  },
  methods: {
    updateYear(newYear) {
      this.selectedYear = newYear
    },
    submitGuess() {
      if (!this.currentGame) return
      const diff = Math.abs(this.selectedYear - this.currentGame.year)
      const k = 0.2027
      const p = 1.3
      const rawScore = 1000 * Math.exp(-k * Math.pow(diff, p))
      let score = Math.floor(rawScore)
      if (score > 1000) score = 1000
      if (score < 1 && diff > 15) score = 0
      this.thisRoundScore = score
      this.$store.commit('addScore', this.thisRoundScore)
      this.showFacts = true
      this.hasSubmitted = true
    },
    closeFacts() {
      this.showFacts = false
    },
    goNext() {
      this.hasSubmitted = false
      if (this.currentRound + 1 < this.selectedGames.length) {
        this.$store.commit('incrementRound')
        this.selectedYear = 2000
      } else {
        this.$router.push('/results')
      }
    }
  }
}
</script>

<style scoped>
.game-view {
  padding: 1rem;
}
</style>
