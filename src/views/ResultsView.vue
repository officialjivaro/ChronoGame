<template>
  <section class="results-view" aria-label="ChronoGame results">
    <ScoreSummary
      :mode-id="selectedMode"
      :total-score="totalScore"
      :round-results="roundResults"
      :max-rounds="maxRounds"
      :lives="lives"
      :best-streak="bestStreak"
      :selected-decade="selectedDecade"
      :daily-practice="dailyPractice"
      :daily-official-recorded="dailyOfficialRecorded"
      :daily-date-key="dailyDateKey"
      :player-stats="playerStats"
      :loading="loading"
      :error="error"
      @play-again="playAgain"
      @home="goHome"
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
    ...mapState([
      'selectedMode',
      'selectedDecade',
      'totalScore',
      'roundResults',
      'maxRounds',
      'lives',
      'bestStreak',
      'dailyPractice',
      'dailyOfficialRecorded',
      'dailyDateKey',
      'playerStats',
      'runStatus'
    ])
  },
  async mounted() {
    if (this.runStatus !== 'complete') {
      await this.$router.replace('/')
      return
    }

    await this.$store.dispatch('finalizeRun')
  },
  methods: {
    async playAgain() {
      this.loading = true
      this.error = ''

      try {
        await this.$store.dispatch('restartRun')
        await this.$router.push('/game')
      } catch (error) {
        this.error = error.message || 'The arcade cabinet could not reset. Please try again.'
      } finally {
        this.loading = false
      }
    },
    goHome() {
      this.$router.push('/')
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
  padding: clamp(0.5rem, 1.8vw, 1.4rem);
  overflow: hidden;
}
</style>
