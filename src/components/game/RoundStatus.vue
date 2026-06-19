<template>
  <ArcadePanel class="round-status" tag="section">
    <div class="round-block">
      <span class="hud-label">Round</span>
      <strong>{{ currentRound + 1 }} / {{ maxRounds }}</strong>
      <div class="round-pips" aria-label="Round progress">
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
    </div>

    <div class="round-prompt">
      <span class="prompt-kicker">Mystery Screenshot</span>
      <strong>When was this game released?</strong>
    </div>

    <div class="score-block">
      <span class="hud-label">Run Score</span>
      <strong>{{ formattedScore }}</strong>
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
    currentRound: {
      type: Number,
      required: true
    },
    maxRounds: {
      type: Number,
      required: true
    },
    totalScore: {
      type: Number,
      default: 0
    }
  },
  computed: {
    formattedScore() {
      return this.totalScore.toLocaleString()
    }
  }
}
</script>

<style scoped>
.round-status {
  display: grid;
  grid-template-columns: minmax(8rem, 0.8fr) minmax(12rem, 1.6fr) minmax(8rem, 0.8fr);
  align-items: center;
  gap: var(--space-3);
  padding: clamp(0.55rem, 1.2vh, 0.85rem) clamp(0.75rem, 1.6vw, 1.25rem);
}

.round-block,
.score-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.score-block {
  align-items: flex-end;
  text-align: right;
}

.hud-label,
.prompt-kicker {
  color: var(--color-text-muted);
  font-size: clamp(0.58rem, 0.9vw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.round-block > strong,
.score-block > strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.78rem, 1.4vw, 1rem);
}

.round-prompt {
  text-align: center;
}

.round-prompt strong {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(0.74rem, 1.5vw, 1rem);
  letter-spacing: 0.035em;
}

.round-pips {
  display: flex;
  gap: 0.28rem;
  margin-top: 0.3rem;
}

.round-pip {
  width: clamp(1rem, 2vw, 1.8rem);
  height: 0.28rem;
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

@media (max-width: 640px) {
  .round-status {
    grid-template-columns: 1fr auto;
  }

  .round-prompt {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (max-height: 640px) {
  .prompt-kicker {
    display: none;
  }

  .round-prompt strong {
    margin-top: 0;
  }
}

</style>
