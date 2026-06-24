<template>
  <ArcadePanel class="score-summary" :accent="true" tag="section">
    <div class="results-heading">
      <span class="results-kicker">{{ mode.name }}</span>
      <h1>{{ heading }}</h1>
      <p>{{ summaryMessage }}</p>
    </div>

    <div class="results-score-grid">
      <div v-if="showRank" class="rank-card">
        <span>Arcade Rank</span>
        <strong>{{ rank.rank }}</strong>
      </div>

      <div class="total-card">
        <span>Total Score</span>
        <strong>{{ totalScore.toLocaleString() }}</strong>
        <small v-if="maxScore">out of {{ maxScore.toLocaleString() }}</small>
        <small v-else>{{ roundResults.length }} games completed</small>
      </div>
    </div>

    <div class="result-metrics">
      <div v-for="metric in metrics" :key="metric.label">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
    </div>

    <div v-if="showRank" class="score-meter" aria-label="Final score progress">
      <span :style="meterStyle"></span>
    </div>

    <p v-if="personalBest" class="personal-best">Classic personal-best score!</p>
    <p v-if="modeId === 'daily'" class="daily-state">
      {{ dailyStateMessage }}
    </p>

    <QuantaReward
      v-if="showQuantaReward"
      :status="quantaRewardStatus"
      :amount="quantaRewardAmount"
      :previous-balance="quantaPreviousBalance"
      :balance="quantaBalance"
      :guest="quantaGuest"
      :message="quantaRewardMessage"
      :rewarded-runs-today="quantaRewardedRunsToday"
      @open-store="$emit('open-store')"
    />

    <div v-if="onlineConfigured" :class="['online-score-card', onlineStatusClass]">
      <div class="online-score-copy">
        <span>Online Score</span>
        <strong>{{ onlineStatusTitle }}</strong>
        <small>{{ onlineStatusMessage }}</small>
      </div>
      <div class="online-score-actions">
        <ArcadeButton
          v-if="!isAuthenticated"
          variant="secondary"
          size="small"
          @click="$emit('sign-in')"
        >
          Sign In
        </ArcadeButton>
        <ArcadeButton
          v-if="onlineSaveStatus === 'error'"
          variant="secondary"
          size="small"
          @click="$emit('retry-online-save')"
        >
          Retry Save
        </ArcadeButton>
        <ArcadeButton
          v-if="onlineSaveStatus === 'saved'"
          variant="ghost"
          size="small"
          @click="$emit('open-leaderboard')"
        >
          View Rankings
        </ArcadeButton>
      </div>
    </div>

    <p v-if="error" class="results-error" role="alert">{{ error }}</p>

    <div class="results-actions">
      <ArcadeButton variant="primary" size="large" :disabled="loading" @click="$emit('play-again')">
        {{ loading ? 'Loading…' : 'Play Again' }}
      </ArcadeButton>
      <ArcadeButton variant="secondary" size="large" @click="$emit('home')">
        Home
      </ArcadeButton>
      <ArcadeButton href="https://jivaro.net/games" target="_top" variant="ghost" size="large">
        Return to Games
      </ArcadeButton>
    </div>
  </ArcadePanel>
</template>

<script>
import ArcadeButton from '../common/ArcadeButton.vue'
import ArcadePanel from '../common/ArcadePanel.vue'
import QuantaReward from './QuantaReward.vue'
import { getGameMode, getModeMaxScore } from '../../config/gameModes.js'
import { getRunRank } from '../../utils/scoring.js'

export default {
  name: 'ScoreSummary',
  components: {
    ArcadeButton,
    ArcadePanel,
    QuantaReward
  },
  props: {
    modeId: { type: String, required: true },
    totalScore: { type: Number, required: true },
    roundResults: { type: Array, default: () => [] },
    maxRounds: { type: Number, default: 10 },
    lives: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    selectedDecade: { type: Number, default: null },
    dailyPractice: { type: Boolean, default: false },
    dailyOfficialRecorded: { type: Boolean, default: false },
    dailyDateKey: { type: String, default: '' },
    playerStats: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    onlineConfigured: { type: Boolean, default: false },
    isAuthenticated: { type: Boolean, default: false },
    onlineSaveStatus: { type: String, default: 'idle' },
    onlineSaveMessage: { type: String, default: '' },
    quantaRewardStatus: { type: String, default: 'idle' },
    quantaRewardAmount: { type: Number, default: 0 },
    quantaPreviousBalance: { type: Number, default: 0 },
    quantaBalance: { type: Number, default: 0 },
    quantaGuest: { type: Boolean, default: true },
    quantaRewardMessage: { type: String, default: '' },
    quantaRewardedRunsToday: { type: Number, default: 0 }
  },
  emits: [
    'play-again',
    'home',
    'sign-in',
    'retry-online-save',
    'open-leaderboard',
    'open-store'
  ],
  computed: {
    mode() {
      return getGameMode(this.modeId)
    },
    maxScore() {
      return this.modeId === 'timeAttack'
        ? 0
        : getModeMaxScore(this.modeId, this.maxRounds)
    },
    rank() {
      return getRunRank(this.totalScore, this.maxScore || 1)
    },
    showRank() {
      return this.modeId !== 'timeAttack'
    },
    heading() {
      if (this.modeId === 'timeAttack') return 'Time Expired'
      if (this.modeId === 'survival') return this.lives > 0 ? 'Survival Cleared' : 'Run Eliminated'
      if (this.modeId === 'daily') return 'Daily Complete'
      return 'Run Complete'
    },
    summaryMessage() {
      if (this.modeId === 'timeAttack') {
        return `You cleared ${this.roundResults.length} games before the cabinet ran out of clock.`
      }
      if (this.modeId === 'survival') {
        return this.lives > 0
          ? `All ten rounds survived with ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`
          : `The timeline claimed the last life after ${this.roundResults.length} rounds.`
      }
      if (this.modeId === 'decade') {
        return `${this.selectedDecade}s complete. ${this.rank.message}`
      }
      if (this.modeId === 'daily') {
        return `${this.dailyDateKey} complete. ${this.rank.message}`
      }
      return this.rank.message
    },
    averageScore() {
      return this.roundResults.length ? Math.round(this.totalScore / this.roundResults.length) : 0
    },
    averageDistance() {
      if (!this.roundResults.length) return '0.0 yrs'
      const total = this.roundResults.reduce((sum, result) => sum + result.difference, 0)
      return `${(total / this.roundResults.length).toFixed(1)} yrs`
    },
    metrics() {
      const common = [
        { label: 'Best Streak', value: this.bestStreak },
        { label: 'Average Miss', value: this.averageDistance }
      ]

      if (this.modeId === 'timeAttack') {
        return [
          { label: 'Games Cleared', value: this.roundResults.length },
          { label: 'Average Score', value: this.averageScore },
          ...common
        ]
      }

      if (this.modeId === 'survival') {
        return [
          { label: 'Rounds Survived', value: this.roundResults.length },
          { label: 'Lives Left', value: this.lives },
          ...common
        ]
      }

      return [
        { label: 'Rounds', value: this.roundResults.length },
        ...common
      ]
    },
    scorePercent() {
      return this.maxScore ? Math.min(100, Math.max(0, (this.totalScore / this.maxScore) * 100)) : 0
    },
    meterStyle() {
      return { width: `${this.scorePercent}%` }
    },
    personalBest() {
      return this.modeId === 'classic' && this.totalScore >= this.playerStats.classicBestScore && this.totalScore > 0
    },
    dailyStateMessage() {
      if (this.dailyPractice) return 'Practice run — today’s official local score remains unchanged.'
      if (this.dailyOfficialRecorded) return 'Official local result recorded. Come back after the next UTC reset.'
      return 'Daily result saved locally.'
    },
    showQuantaReward() {
      return this.quantaRewardStatus !== 'idle'
    },
    onlineStatusTitle() {
      if (!this.isAuthenticated) return 'Guest Run'
      if (this.onlineSaveStatus === 'saving') return 'Saving…'
      if (this.onlineSaveStatus === 'saved') return 'Saved Online'
      if (this.onlineSaveStatus === 'error') return 'Save Failed'
      return 'Account Connected'
    },
    onlineStatusMessage() {
      if (this.onlineSaveMessage) return this.onlineSaveMessage
      if (!this.isAuthenticated) return 'Sign in to attach this completed run to your account.'
      return 'Completed runs are saved automatically.'
    },
    onlineStatusClass() {
      return `online-status-${this.onlineSaveStatus}`
    }
  }
}
</script>

<style scoped>
.score-summary {
  width: min(56rem, 100%);
  max-height: 100%;
  display: grid;
  gap: clamp(0.5rem, 1.25vh, 0.9rem);
  padding: clamp(0.75rem, 2vw, 1.55rem);
  text-align: center;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent-dark) #121419;
}

.results-kicker,
.rank-card span,
.total-card span,
.result-metrics span {
  color: var(--color-text-muted);
  font-size: clamp(0.54rem, 0.85vw, 0.68rem);
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.results-heading h1 {
  margin: 0.2rem 0 0.35rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 6vw, 4.2rem);
  line-height: 0.95;
  text-shadow: var(--shadow-text), 0 0 24px rgba(255, 138, 50, 0.2);
}

.results-heading p {
  max-width: 42rem;
  margin: 0 auto;
  color: var(--color-text-muted);
  font-size: clamp(0.7rem, 1.2vw, 0.9rem);
  line-height: 1.45;
}

.results-score-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: var(--space-2);
}

.results-score-grid:has(.total-card:only-child) {
  grid-template-columns: 1fr;
}

.rank-card,
.total-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: clamp(4.5rem, 12vh, 6.8rem);
  padding: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-medium);
  background: rgba(0, 0, 0, 0.24);
}

.rank-card strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 4rem);
  line-height: 1;
}

.total-card strong {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 4vw, 2.8rem);
}

.total-card small {
  color: var(--color-text-muted);
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
}

.result-metrics > div {
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-small);
  background: rgba(255, 255, 255, 0.025);
}

.result-metrics strong {
  display: block;
  margin-top: 0.18rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.65rem, 1.2vw, 0.9rem);
}

.score-meter {
  height: 0.65rem;
  overflow: hidden;
  border: 1px solid #3d4149;
  border-radius: 999px;
  background: #101216;
}

.score-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent-dark), var(--color-accent-bright));
  box-shadow: 0 0 15px rgba(255, 138, 50, 0.55);
  transition: width 600ms ease;
}

.personal-best,
.daily-state,
.results-error {
  margin: 0;
  font-size: 0.68rem;
}

.personal-best {
  color: var(--color-success);
  font-family: var(--font-display);
  animation: result-glow 1.2s ease-in-out infinite alternate;
}

.daily-state {
  color: var(--color-text-muted);
}

.results-error {
  color: var(--color-danger);
}

.online-score-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 0.58rem 0.7rem;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.24);
}

.online-score-copy {
  min-width: 0;
}

.online-score-copy span,
.online-score-copy strong,
.online-score-copy small {
  display: block;
}

.online-score-copy span {
  color: var(--color-text-muted);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.online-score-copy strong {
  margin-top: 0.1rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 0.74rem;
}

.online-score-copy small {
  margin-top: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.62rem;
}

.online-score-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.35rem;
}

.online-status-saved {
  border-color: rgba(102, 220, 139, 0.35);
}

.online-status-error {
  border-color: rgba(255, 93, 93, 0.4);
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

@media (max-width: 650px) {
  .result-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .online-score-card {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }

  .online-score-actions {
    justify-content: center;
  }

  .results-actions {
    flex-direction: column;
  }
}

@media (max-height: 620px) {
  .score-summary {
    gap: 0.4rem;
    padding: 0.65rem;
  }

  .rank-card,
  .total-card {
    min-height: 3.8rem;
  }
}
</style>
