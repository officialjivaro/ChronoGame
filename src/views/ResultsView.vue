<template>
  <section class="results-view" aria-label="ChronoGame results">
    <ScoreSummary
      :total-score="totalScore"
      :max-score="maxScore"
      :loading="loading"
      :error="error"
      @play-again="playAgain"
    />
  </section>
</template>

<script>
import { mapState } from 'vuex'
import ScoreSummary from '../components/results/ScoreSummary.vue'

export default {
  name: 'ResultsView',
  components: {
    ScoreSummary
  },
  data() {
    return {
      loading: false,
      error: ''
    }
  },
  computed: {
    ...mapState(['totalScore', 'maxRounds']),
    maxScore() {
      return this.maxRounds * 1000
    }
  },
  methods: {
    async playAgain() {
      this.loading = true
      this.error = ''
      this.$store.commit('resetGame')

      try {
        await this.$store.dispatch('loadGames')
        await this.$store.dispatch('selectRandomGames')
        await this.$router.push('/game')
      } catch (error) {
        this.error = error.message || 'The arcade cabinet could not reset. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.results-view {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.65rem, 2.5vw, 2rem);
  overflow: hidden;
}
</style>
