<template>
  <ArcadePanel :class="['round-status', { 'round-status-survival': modeId === 'survival' }]" tag="section">
    <div class="mode-block">
      <span class="hud-label">Mode</span>
      <strong>{{ modeName }}</strong>
      <small v-if="modeId === 'decade' && selectedDecade">{{ selectedDecade }}s only</small>
      <small v-else-if="modeId === 'daily'">{{ dailyPractice ? 'Practice run' : dailyDateKey }}</small>
    </div>

    <div v-if="modeId === 'timeAttack'" class="timer-block" :class="timerClass">
      <span class="hud-label">Time Remaining</span>
      <strong>{{ formattedTime }}</strong>
      <div class="timer-meter" aria-hidden="true">
        <span :style="timerMeterStyle"></span>
      </div>
    </div>

    <div v-else class="round-block">
      <span class="hud-label">Round</span>
      <strong>{{ currentRound + 1 }} / {{ maxRounds }}</strong>
      <div class="round-pips desktop-progress" aria-label="Round progress">
        <span
          v-for="round in maxRounds"
          :key="round"
          :class="[
            'round-pip',
            {
              'round-pip-complete': round - 1 < currentRound,
              'round-pip-current': round - 1 === currentRound
            }
          ]"
        ></span>
      </div>
      <div class="mobile-progress" aria-hidden="true">
        <span :style="roundMeterStyle"></span>
      </div>
    </div>

    <div v-if="modeId === 'survival'" class="lives-block">
      <span class="hud-label">Lives</span>
      <div class="life-row" :aria-label="`${lives} lives remaining`">
        <span v-for="life in 3" :key="life" :class="['life-icon', { 'life-icon-lost': life > lives }]">◆</span>
      </div>
    </div>

    <div class="streak-block">
      <span class="hud-label">Streak</span>
      <strong :class="{ 'streak-active': currentStreak > 0 }">{{ currentStreak }}</strong>
      <small>Best {{ bestStreak }}</small>
    </div>

    <div class="score-block">
      <span class="hud-label">Run Score</span>
      <strong>{{ formattedScore }}</strong>
      <small v-if="modeId === 'timeAttack'">{{ completedRounds }} cleared</small>
    </div>
  </ArcadePanel>
</template>

<script>
import ArcadePanel from '../common/ArcadePanel.vue'

export default {
  name: 'RoundStatus',
  components: {
    ArcadePanel
  },
  props: {
    modeId: { type: String, required: true },
    modeName: { type: String, required: true },
    currentRound: { type: Number, required: true },
    maxRounds: { type: Number, required: true },
    totalScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lives: { type: Number, default: 0 },
    remainingSeconds: { type: Number, default: 0 },
    timerSeconds: { type: Number, default: 120 },
    completedRounds: { type: Number, default: 0 },
    selectedDecade: { type: Number, default: null },
    dailyDateKey: { type: String, default: '' },
    dailyPractice: { type: Boolean, default: false }
  },
  computed: {
    formattedScore() {
      return this.totalScore.toLocaleString()
    },
    formattedTime() {
      const seconds = Math.max(0, Math.ceil(this.remainingSeconds))
      const minutes = Math.floor(seconds / 60)
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
    },
    timerPercent() {
      return this.timerSeconds > 0 ? Math.min(100, (this.remainingSeconds / this.timerSeconds) * 100) : 0
    },
    timerMeterStyle() {
      return { width: `${this.timerPercent}%` }
    },
    timerClass() {
      return {
        'timer-warning': this.remainingSeconds <= 30,
        'timer-danger': this.remainingSeconds <= 10
      }
    },
    roundMeterStyle() {
      const progress = this.maxRounds > 0 ? ((this.currentRound + 1) / this.maxRounds) * 100 : 0
      return { width: `${Math.min(100, progress)}%` }
    }
  }
}
</script>

<style scoped>
.round-status {
  display: grid;
  grid-template-columns: minmax(6rem, 0.85fr) minmax(9rem, 1.35fr) auto auto;
  align-items: center;
  gap: clamp(0.55rem, 1.4vw, 1rem);
  padding: clamp(0.5rem, 1vh, 0.75rem) clamp(0.65rem, 1.4vw, 1rem);
}

.round-status-survival {
  grid-template-columns: minmax(5.5rem, 0.8fr) minmax(8rem, 1.2fr) auto auto auto;
}

.mode-block,
.round-block,
.timer-block,
.streak-block,
.score-block,
.lives-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.streak-block,
.score-block,
.lives-block {
  align-items: flex-end;
  text-align: right;
}

.hud-label {
  color: var(--color-text-muted);
  font-size: clamp(0.64rem, 0.85vw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.mode-block strong,
.round-block > strong,
.timer-block > strong,
.streak-block > strong,
.score-block > strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.72rem, 1.2vw, 0.95rem);
}

.mode-block small,
.streak-block small,
.score-block small {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.round-pips {
  display: flex;
  gap: 0.22rem;
  margin-top: 0.25rem;
}

.round-pip {
  flex: 1;
  min-width: 0.45rem;
  max-width: 1.35rem;
  height: 0.25rem;
  border-radius: 999px;
  background: #3a3e46;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.55) inset;
}

.round-pip-complete {
  background: #7a4b2e;
}

.round-pip-current {
  background: var(--color-accent);
  box-shadow: 0 0 9px rgba(255, 138, 50, 0.7);
}

.mobile-progress,
.timer-meter {
  height: 0.3rem;
  margin-top: 0.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: #30343b;
}

.mobile-progress {
  display: none;
}

.mobile-progress span,
.timer-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent-dark), var(--color-accent-bright));
  transition: width 180ms linear;
}

.timer-warning > strong {
  color: var(--color-warning);
}

.timer-danger > strong {
  color: var(--color-danger);
  animation: timer-warning-pulse 0.65s ease-in-out infinite alternate;
}

.life-row {
  display: flex;
  gap: 0.25rem;
  color: var(--color-accent-bright);
}

.life-icon {
  text-shadow: 0 0 9px rgba(255, 138, 50, 0.55);
}

.life-icon-lost {
  color: #484c54;
  text-shadow: none;
}

.streak-active {
  text-shadow: 0 0 12px rgba(255, 138, 50, 0.62);
  animation: streak-ignite 500ms ease-out;
}

@media (max-width: 720px) {
  .round-status {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .round-block,
  .timer-block {
    grid-column: span 2;
  }

  .desktop-progress {
    display: none;
  }

  .mobile-progress {
    display: block;
  }
}

@media (max-width: 460px) {
  .mode-block small,
  .streak-block small,
  .score-block small {
    display: none;
  }

  .round-status {
    padding-inline: 0.45rem;
  }
}
</style>
