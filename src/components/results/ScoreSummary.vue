<template>
  <ArcadePanel class="score-summary" :accent="true" tag="section">
    <div class="results-heading">
      <span class="results-kicker">Run Complete</span>
      <h1>Game Over</h1>
      <p>{{ rank.message }}</p>
    </div>

    <div class="results-score-grid">
      <div class="rank-card">
        <span>Arcade Rank</span>
        <strong>{{ rank.rank }}</strong>
      </div>

      <div class="total-card">
        <span>Total Score</span>
        <strong>{{ formattedScore }}</strong>
        <small>out of {{ maxScore.toLocaleString() }}</small>
      </div>
    </div>

    <div class="score-meter" aria-label="Final score progress">
      <span :style="meterStyle"></span>
    </div>

    <p v-if="error" class="results-error" role="alert">{{ error }}</p>

    <div class="results-actions">
      <ArcadeButton
        variant="primary"
        size="large"
        :disabled="loading"
        @click="$emit('play-again')"
      >
        {{ loading ? 'Loading…' : 'Play Again' }}
      </ArcadeButton>
      <ArcadeButton
        href="https://jivaro.net/games"
        target="_top"
        variant="secondary"
        size="large"
      >
        Return to Games
      </ArcadeButton>
    </div>
  </ArcadePanel>
</template>

<script>
import ArcadeButton from '../common/ArcadeButton.vue'
import ArcadePanel from '../common/ArcadePanel.vue'
import { getRunRank } from '../../utils/scoring.js'

export default {
  name: 'ScoreSummary',
  components: {
    ArcadeButton,
    ArcadePanel
  },
  props: {
    totalScore: {
      type: Number,
      required: true
    },
    maxScore: {
      type: Number,
      default: 5000
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['play-again'],
  computed: {
    rank() {
      return getRunRank(this.totalScore, this.maxScore)
    },
    formattedScore() {
      return this.totalScore.toLocaleString()
    },
    scorePercent() {
      return Math.min(100, Math.max(0, (this.totalScore / this.maxScore) * 100))
    },
    meterStyle() {
      return {
        width: `${this.scorePercent}%`
      }
    }
  }
}
</script>

<style scoped>
.score-summary {
  width: min(52rem, 100%);
  display: grid;
  gap: clamp(0.9rem, 2.3vh, 1.7rem);
  padding: clamp(1rem, 3vw, 2.4rem);
  text-align: center;
}

.results-kicker,
.rank-card span,
.total-card span {
  color: var(--color-text-muted);
  font-size: clamp(0.62rem, 1vw, 0.75rem);
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.results-heading h1 {
  margin: 0.25rem 0 0.55rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(2rem, 7vw, 5rem);
  line-height: 0.95;
  letter-spacing: 0.04em;
  text-shadow: var(--shadow-text), 0 0 24px rgba(255, 138, 50, 0.2);
}

.results-heading p {
  max-width: 40rem;
  margin: 0 auto;
  color: var(--color-text-muted);
  font-size: clamp(0.78rem, 1.5vw, 1rem);
  line-height: 1.5;
}

.results-score-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: var(--space-2);
}

.rank-card,
.total-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: clamp(6rem, 17vh, 9rem);
  padding: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-medium);
  background: rgba(0, 0, 0, 0.24);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.34) inset;
}

.rank-card strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 8vw, 5.5rem);
  line-height: 1;
  text-shadow: 0 0 20px rgba(255, 138, 50, 0.38);
}

.total-card strong {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 5vw, 3.3rem);
  line-height: 1.1;
}

.total-card small {
  color: var(--color-text-muted);
}

.score-meter {
  height: 0.75rem;
  overflow: hidden;
  border: 1px solid #3d4149;
  border-radius: 999px;
  background: #101216;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.68) inset;
}

.score-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent-dark), var(--color-accent-bright));
  box-shadow: 0 0 15px rgba(255, 138, 50, 0.55);
  transition: width 600ms ease;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.results-error {
  margin: 0;
  color: var(--color-danger);
}

@media (max-width: 620px) {
  .results-score-grid {
    grid-template-columns: 0.7fr 1.3fr;
  }

  .results-actions {
    flex-direction: column;
  }
}

@media (max-height: 620px) {
  .score-summary {
    gap: 0.55rem;
    padding: 0.75rem;
  }

  .rank-card,
  .total-card {
    min-height: 4.3rem;
  }
}
</style>
