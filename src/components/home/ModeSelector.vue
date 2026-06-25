<template>
  <section class="mode-selector" aria-labelledby="mode-selector-title">
    <div class="mode-heading">
      <span>Choose Your Cabinet</span>
      <strong id="mode-selector-title">Game Mode</strong>
    </div>

    <div class="mode-grid" role="list">
      <button
        v-for="mode in modes"
        :key="mode.id"
        type="button"
        :class="['mode-card', { 'mode-card-selected': mode.id === modelValue }]"
        :aria-pressed="mode.id === modelValue"
        @click="$emit('update:modelValue', mode.id)"
      >
        <strong>{{ mode.name }}</strong>
        <span>{{ modeBadge(mode) }}</span>
      </button>
    </div>

    <div class="mode-details">
      <p>{{ activeMode.shortDescription }}</p>
      <div class="mode-rule-row" aria-label="Selected mode rules">
        <span v-for="rule in activeRules" :key="rule">{{ rule }}</span>
      </div>
    </div>

    <div v-if="activeMode.requiresDecade" class="decade-picker">
      <span class="decade-label">Select a decade</span>
      <div class="decade-grid">
        <button
          v-for="option in decadeAvailability"
          :key="option.decade"
          type="button"
          :disabled="!option.eligible"
          :class="['decade-button', { 'decade-button-selected': option.decade === selectedDecade }]"
          :aria-pressed="option.decade === selectedDecade"
          @click="$emit('update:selectedDecade', option.decade)"
        >
          <strong>{{ option.decade }}s</strong>
          <small>{{ option.count }} games</small>
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { GAME_MODES, MODE_ORDER } from '../../config/gameModes.js'

export default {
  name: 'ModeSelector',
  props: {
    modelValue: {
      type: String,
      default: 'classic'
    },
    selectedDecade: {
      type: Number,
      default: null
    },
    decadeAvailability: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'update:selectedDecade'],
  computed: {
    modes() {
      return MODE_ORDER.map((modeId) => GAME_MODES[modeId])
    },
    activeMode() {
      return GAME_MODES[this.modelValue] || GAME_MODES.classic
    },
    activeRules() {
      const rules = []

      if (this.activeMode.roundLimit) rules.push(`${this.activeMode.roundLimit} rounds`)
      if (this.activeMode.timerSeconds) rules.push(`${this.activeMode.timerSeconds} seconds`)
      if (this.activeMode.startingLives) rules.push(`${this.activeMode.startingLives} lives`)
      if (this.activeMode.hints.length) rules.push(`${this.activeMode.hints.length} hints`)
      if (!this.activeMode.hints.length) rules.push('No hints')

      return rules
    }
  },
  methods: {
    modeBadge(mode) {
      if (mode.timerSeconds) return `${mode.timerSeconds}s` 
      if (mode.startingLives) return `${mode.startingLives} lives`
      if (mode.id === 'daily') return 'UTC daily'
      return `${mode.roundLimit} rounds`
    }
  }
}
</script>

<style scoped>
.mode-selector {
  min-width: 0;
  display: grid;
  gap: clamp(0.45rem, 1vh, 0.75rem);
}

.mode-heading span,
.decade-label {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mode-heading strong {
  display: block;
  margin-top: 0.1rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(0.9rem, 1.8vw, 1.15rem);
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(0.3rem, 0.7vw, 0.55rem);
}

.mode-card,
.decade-button {
  min-width: 0;
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-small);
  background: linear-gradient(180deg, #30343c, #181b20);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.07) inset;
  cursor: pointer;
  transition: border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.mode-card {
  min-height: clamp(3.1rem, 8vh, 4.5rem);
  padding: 0.45rem 0.35rem;
}

.mode-card:hover,
.decade-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(255, 138, 50, 0.55);
}

.mode-card-selected,
.decade-button-selected {
  border-color: var(--color-accent);
  background: linear-gradient(180deg, rgba(255, 138, 50, 0.22), #1b1d22);
  box-shadow: 0 0 16px rgba(255, 138, 50, 0.2), 0 6px 14px rgba(0, 0, 0, 0.35);
}

.mode-card strong,
.mode-card span,
.decade-button strong,
.decade-button small {
  display: block;
}

.mode-card strong {
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(0.66rem, 0.9vw, 0.74rem);
  line-height: 1.2;
  text-overflow: ellipsis;
}

.mode-card span,
.decade-button small {
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: clamp(0.62rem, 0.75vw, 0.68rem);
  font-weight: 700;
  text-transform: uppercase;
}

.mode-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border-left: 3px solid var(--color-accent);
  background: rgba(0, 0, 0, 0.2);
}

.mode-details p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: clamp(0.64rem, 1vw, 0.78rem);
  line-height: 1.4;
}

.mode-rule-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.3rem;
  flex-shrink: 0;
}

.mode-rule-row span {
  padding: 0.22rem 0.4rem;
  color: var(--color-accent-bright);
  border: 1px solid rgba(255, 138, 50, 0.22);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.decade-picker {
  display: grid;
  gap: 0.35rem;
}

.decade-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.3rem;
}

.decade-button {
  min-height: 2.5rem;
  padding: 0.3rem 0.2rem;
}

.decade-button strong {
  font-family: var(--font-display);
  font-size: clamp(0.65rem, 0.9vw, 0.72rem);
}

.decade-button:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .mode-grid {
    grid-template-columns: repeat(5, minmax(3.2rem, 1fr));
  }

  .mode-details {
    align-items: flex-start;
    flex-direction: column;
  }

  .mode-rule-row {
    justify-content: flex-start;
  }

  .decade-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .mode-card {
    min-height: 2.75rem;
    padding-inline: 0.2rem;
  }

  .mode-card span {
    display: none;
  }
}

@media (max-height: 650px) {
  .mode-details p {
    display: none;
  }

  .mode-card {
    min-height: 2.65rem;
  }
}
</style>
