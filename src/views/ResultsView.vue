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
      :online-configured="onlineConfigured"
      :is-authenticated="isAuthenticated"
      :online-save-status="scoreSaveStatus"
      :online-save-message="scoreSaveMessage"
      :quanta-reward-status="quantaRewardStatus"
      :quanta-reward-amount="quantaRewardAmount"
      :quanta-previous-balance="quantaPreviousBalance"
      :quanta-balance="quantaBalance"
      :quanta-guest="quantaGuest"
      :quanta-reward-message="quantaRewardMessage"
      :quanta-rewarded-runs-today="quantaRewardedRunsToday"
      @play-again="playAgain"
      @home="goHome"
      @sign-in="openAccount"
      @retry-online-save="saveOnlineRun"
      @open-leaderboard="openLeaderboard"
      @open-store="openStore"
    />
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
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
    ]),
    ...mapState('online', {
      onlineConfigured: 'configured',
      scoreSaveStatus: 'scoreSaveStatus',
      scoreSaveMessage: 'scoreSaveMessage'
    }),
    ...mapState('economy', {
      quantaRewardStatus: 'rewardStatus',
      quantaRewardAmount: 'rewardAmount',
      quantaPreviousBalance: 'previousBalance',
      quantaBalance: 'balance',
      quantaGuest: 'guest',
      quantaRewardMessage: 'rewardMessage',
      quantaRewardedRunsToday: 'rewardedRunsToday'
    }),
    ...mapGetters('online', ['isAuthenticated'])
  },
  watch: {
    isAuthenticated(authenticated) {
      if (authenticated && this.runStatus === 'complete') {
        this.saveOnlineRun()
      }
    }
  },
  async mounted() {
    if (this.runStatus !== 'complete') {
      await this.$router.replace('/')
      return
    }

    await this.$store.dispatch('finalizeRun')
    await this.saveOnlineRun()
  },
  methods: {
    async saveOnlineRun() {
      await this.$store.dispatch('online/saveCurrentRun')
    },
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
    },
    openAccount() {
      this.$store.commit('online/setAuthModalOpen', true)
    },
    openLeaderboard() {
      this.$store.commit('online/setLeaderboardOpen', true)
    },
    openStore() {
      this.$store.dispatch('economy/openStore')
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
