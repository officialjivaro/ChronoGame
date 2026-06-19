<template>
  <Teleport to="body">
    <div class="feedback-backdrop" role="presentation" @click.self="closePanel">
      <ArcadePanel
        class="feedback-card"
        :accent="true"
        tag="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <button
          ref="closeButton"
          class="feedback-close"
          type="button"
          aria-label="Close round results"
          @click="closePanel"
        >
          ×
        </button>

        <div class="feedback-heading">
          <span class="feedback-kicker">Round Result</span>
          <h2 id="feedback-title">{{ gameInfo.title }}</h2>
        </div>

        <div class="score-row">
          <div :class="['score-orb', performance.className]">
            <strong>{{ score.toLocaleString() }}</strong>
            <span>points</span>
          </div>
          <div class="performance-copy">
            <span>Performance</span>
            <strong>{{ performance.label }}</strong>
          </div>
        </div>

        <div class="feedback-scroll internal-scroll">
          <dl class="game-details">
            <div>
              <dt>Release Year</dt>
              <dd>{{ gameInfo.year }}</dd>
            </div>
            <div>
              <dt>Developer</dt>
              <dd>{{ gameInfo.developer }}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>{{ gameInfo.publisher }}</dd>
            </div>
          </dl>

          <section class="facts-panel" :class="{ 'facts-panel-locked': !factsUnlocked }">
            <span class="facts-label">Game File</span>
            <p v-if="factsUnlocked">
              {{ gameInfo.facts || 'This cabinet is missing its trivia card. The game data may need one more fact check.' }}
            </p>
            <p v-else>
              Oof, the trivia vault needs at least 400 points to open. Sharpen that time-travel radar and try again next round.
            </p>
          </section>
        </div>

        <p class="feedback-hint">Close this panel, then choose Next Round.</p>
      </ArcadePanel>
    </div>
  </Teleport>
</template>

<script>
import ArcadePanel from '../common/ArcadePanel.vue'
import { getPerformanceBand } from '../../utils/scoring.js'

export default {
  name: 'RoundFeedback',
  components: {
    ArcadePanel
  },
  props: {
    score: {
      type: Number,
      required: true
    },
    game: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      previousFocus: null
    }
  },
  computed: {
    gameInfo() {
      return this.game || {}
    },
    performance() {
      return getPerformanceBand(this.score)
    },
    factsUnlocked() {
      return this.score >= 400
    }
  },
  mounted() {
    this.previousFocus = document.activeElement
    document.addEventListener('keydown', this.handleKeydown)
    this.$nextTick(() => {
      this.$refs.closeButton?.focus()
    })
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
    this.previousFocus?.focus?.()
  },
  methods: {
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closePanel()
      }
    },
    closePanel() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.feedback-backdrop {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.5rem, 2vw, 1.5rem);
  background: rgba(3, 4, 6, 0.78);
  backdrop-filter: blur(8px);
}

.feedback-card {
  width: clamp(20rem, 64vw, 47rem);
  max-width: calc(100vw - 1rem);
  max-height: min(86dvh, 48rem);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  overflow: hidden;
  box-shadow: var(--shadow-panel-deep), 0 0 36px rgba(255, 138, 50, 0.2);
}

.feedback-close {
  position: absolute;
  z-index: 2;
  top: 0.7rem;
  right: 0.7rem;
  width: 2.35rem;
  aspect-ratio: 1;
  color: var(--color-text);
  border: 1px solid #555b65;
  border-radius: 50%;
  background: linear-gradient(180deg, #3a3f48, #1b1e23);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  font-size: 1.45rem;
  line-height: 1;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.feedback-close:hover {
  border-color: var(--color-accent);
  transform: rotate(5deg) scale(1.05);
}

.feedback-heading {
  padding-right: 2.8rem;
}

.feedback-kicker,
.facts-label,
.performance-copy span {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.feedback-heading h2 {
  margin: 0.25rem 0 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 2.7vw, 1.85rem);
  line-height: 1.15;
}

.score-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-medium);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.25) inset;
}

.score-orb {
  min-width: clamp(7rem, 16vw, 10rem);
  padding: 0.8rem 1rem;
  text-align: center;
  border: 1px solid currentColor;
  border-radius: var(--radius-medium);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 18px color-mix(in srgb, currentColor 25%, transparent);
}

.score-orb strong {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1;
}

.score-orb span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.performance-copy strong {
  display: block;
  margin-top: 0.2rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(0.95rem, 2vw, 1.25rem);
}

.score-perfect {
  color: var(--color-success);
}

.score-excellent {
  color: var(--color-success-soft);
}

.score-strong {
  color: var(--color-warning);
}

.score-close {
  color: var(--color-accent-bright);
}

.score-low {
  color: var(--color-danger);
}

.feedback-scroll {
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.game-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin: 0 0 var(--space-3);
}

.game-details > div {
  min-width: 0;
  padding: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-small);
  background: rgba(255, 255, 255, 0.025);
}

.game-details dt {
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.game-details dd {
  margin: 0.25rem 0 0;
  color: var(--color-text);
  font-size: clamp(0.75rem, 1.4vw, 0.9rem);
  overflow-wrap: anywhere;
}

.facts-panel {
  padding: var(--space-3);
  border-left: 3px solid var(--color-accent);
  background: linear-gradient(90deg, rgba(255, 138, 50, 0.09), rgba(255, 255, 255, 0.025));
}

.facts-panel-locked {
  border-left-color: var(--color-danger);
  background: linear-gradient(90deg, rgba(255, 93, 93, 0.08), rgba(255, 255, 255, 0.025));
}

.facts-panel p {
  margin: 0.45rem 0 0;
  color: #d8d9dd;
  font-size: clamp(0.78rem, 1.35vw, 0.95rem);
  line-height: 1.65;
}

.feedback-hint {
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

@media (max-width: 600px) {
  .feedback-card {
    width: calc(100vw - 1rem);
    max-height: 91dvh;
  }

  .game-details {
    grid-template-columns: 1fr;
  }

  .score-row {
    align-items: stretch;
  }
}

@media (max-height: 620px) {
  .feedback-card {
    max-height: 94dvh;
    gap: 0.55rem;
    padding: 0.7rem;
  }

  .feedback-hint {
    display: none;
  }
}
</style>
