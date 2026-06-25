<template>
  <Teleport to="body">
    <div class="feedback-backdrop" role="presentation" @click.self="closePanel">
      <ArcadePanel
        :class="['feedback-card', { 'feedback-card-compact': compact }]"
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
          :aria-label="compact ? 'Continue to the next game' : 'Close round results'"
          @click="closePanel"
        >
          ×
        </button>

        <div class="feedback-heading">
          <span class="feedback-kicker">{{ compact ? 'Quick Result' : 'Round Result' }}</span>
          <h2 id="feedback-title">{{ gameInfo.title }}</h2>
        </div>

        <div class="score-row">
          <div :class="['score-orb', performance.className]">
            <strong>{{ animatedScore.toLocaleString() }}</strong>
            <span>points</span>
          </div>
          <div class="performance-copy">
            <span>{{ result.accuracyLabel || performance.label }}</span>
            <strong>{{ result.accuracyMessage }}</strong>
            <small v-if="result.baseScore !== result.score">
              Base {{ result.baseScore }} · capped at {{ result.scoreCeiling }} by hints
            </small>
          </div>
        </div>

        <div class="feedback-scroll internal-scroll">
          <dl class="guess-details">
            <div>
              <dt>Your Guess</dt>
              <dd>{{ result.selectedYear }}</dd>
            </div>
            <div>
              <dt>Release Year</dt>
              <dd>{{ result.correctYear }}</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd>{{ result.difference }} {{ result.difference === 1 ? 'year' : 'years' }}</dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd>{{ result.streak }}</dd>
            </div>
          </dl>

          <div v-if="result.usedHints?.length" class="hint-summary">
            <span>Hints used</span>
            <strong>{{ hintLabels }}</strong>
          </div>

          <div v-if="modeId === 'survival'" :class="['life-result', { 'life-result-lost': result.lifeLost }]">
            <strong>{{ result.lifeLost ? 'Life Lost' : 'Life Preserved' }}</strong>
            <span>{{ result.livesRemaining }} {{ result.livesRemaining === 1 ? 'life' : 'lives' }} remaining</span>
          </div>

          <template v-if="!compact">
            <dl class="game-details">
              <div>
                <dt>Developer</dt>
                <dd>{{ gameInfo.developer }}</dd>
              </div>
              <div>
                <dt>Publisher</dt>
                <dd>{{ gameInfo.publisher }}</dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>{{ gameInfo.platforms?.join(' / ') }}</dd>
              </div>
            </dl>

            <section class="facts-panel" :class="{ 'facts-panel-locked': !result.factsUnlocked }">
              <span class="facts-label">Game File</span>
              <p v-if="result.factsUnlocked">
                {{ gameInfo.facts || 'This cabinet is missing its trivia card. The game data may need one more fact check.' }}
              </p>
              <p v-else>
                Oof, the trivia vault needs at least 400 awarded points to open. Sharpen that time-travel radar and try again next round.
              </p>
            </section>
          </template>
        </div>

        <p class="feedback-hint">
          {{ compact ? 'Continuing automatically — close now to skip the wait.' : 'Close this panel, then choose Next Round.' }}
        </p>
      </ArcadePanel>
    </div>
  </Teleport>
</template>

<script>
import ArcadePanel from '../common/ArcadePanel.vue'
import { HINT_DEFINITIONS } from '../../config/gameModes.js'
import { getPerformanceBand } from '../../utils/scoring.js'

export default {
  name: 'RoundFeedback',
  components: {
    ArcadePanel
  },
  props: {
    result: {
      type: Object,
      required: true
    },
    game: {
      type: Object,
      default: null
    },
    modeId: {
      type: String,
      required: true
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      previousFocus: null,
      animatedScore: 0,
      animationFrame: null
    }
  },
  computed: {
    gameInfo() {
      return this.game || {}
    },
    performance() {
      return getPerformanceBand(this.result.score)
    },
    hintLabels() {
      return (this.result.usedHints || [])
        .map((hintId) => HINT_DEFINITIONS[hintId]?.label)
        .filter(Boolean)
        .join(', ')
    }
  },
  mounted() {
    this.previousFocus = document.activeElement
    document.addEventListener('keydown', this.handleKeydown)
    this.animateScore()
    this.$nextTick(() => {
      this.$refs.closeButton?.focus()
    })
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
    cancelAnimationFrame(this.animationFrame)
    this.previousFocus?.focus?.()
  },
  methods: {
    animateScore() {
      const target = Number(this.result.score || 0)
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

      if (reducedMotion || target === 0) {
        this.animatedScore = target
        return
      }

      const startTime = performance.now()
      const duration = 520

      const update = (time) => {
        const progress = Math.min(1, (time - startTime) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        this.animatedScore = Math.round(target * eased)

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(update)
        }
      }

      this.animationFrame = requestAnimationFrame(update)
    },
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
  padding: clamp(0.45rem, 1.7vw, 1.25rem);
  background: rgba(3, 4, 6, 0.8);
  backdrop-filter: blur(8px);
}

.feedback-card {
  width: clamp(20rem, 68vw, 51rem);
  max-width: calc(100vw - 0.9rem);
  max-height: min(90dvh, 50rem);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: clamp(0.55rem, 1.3vh, 0.9rem);
  overflow: hidden;
  box-shadow: var(--shadow-panel-deep), 0 0 36px rgba(255, 138, 50, 0.2);
}

.feedback-card-compact {
  width: clamp(19rem, 52vw, 36rem);
  max-height: min(76dvh, 30rem);
}

.feedback-close {
  position: absolute;
  z-index: 2;
  top: 0.65rem;
  right: 0.65rem;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-text);
  border: 1px solid #555b65;
  border-radius: 50%;
  background: linear-gradient(180deg, #3a3f48, #1b1e23);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  font-size: 1.45rem;
  line-height: 1;
}

.feedback-heading {
  padding-right: 2.8rem;
}

.feedback-kicker,
.facts-label,
.performance-copy span,
.hint-summary span {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.feedback-heading h2 {
  margin: 0.2rem 0 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1rem, 2.5vw, 1.75rem);
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
}

.score-orb {
  min-width: clamp(7rem, 16vw, 10rem);
  padding: 0.7rem 0.9rem;
  text-align: center;
  border: 1px solid currentColor;
  border-radius: var(--radius-medium);
  background: rgba(255, 255, 255, 0.03);
}

.score-orb strong,
.score-orb span {
  display: block;
}

.score-orb strong {
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 4vw, 2.4rem);
  line-height: 1;
}

.score-orb span {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.67rem;
  font-weight: 800;
  text-transform: uppercase;
}

.performance-copy strong {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text);
  font-size: clamp(0.75rem, 1.5vw, 0.95rem);
  line-height: 1.35;
}

.performance-copy small {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-warning);
  font-size: 0.68rem;
}

.score-perfect { color: var(--color-success); }
.score-excellent { color: var(--color-success-soft); }
.score-strong { color: var(--color-warning); }
.score-close { color: var(--color-accent-bright); }
.score-low { color: var(--color-danger); }

.feedback-scroll {
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.guess-details,
.game-details {
  display: grid;
  gap: 0.45rem;
  margin: 0 0 0.65rem;
}

.guess-details {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.game-details {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.guess-details > div,
.game-details > div {
  min-width: 0;
  padding: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-small);
  background: rgba(255, 255, 255, 0.025);
}

.guess-details dt,
.game-details dt {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.guess-details dd,
.game-details dd {
  margin: 0.18rem 0 0;
  color: var(--color-text);
  font-size: clamp(0.7rem, 1.2vw, 0.86rem);
  overflow-wrap: anywhere;
}

.hint-summary,
.life-result {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  padding: 0.55rem 0.65rem;
  border-left: 3px solid var(--color-accent);
  background: rgba(255, 138, 50, 0.07);
}

.hint-summary strong,
.life-result strong {
  color: var(--color-accent-bright);
  font-size: 0.68rem;
}

.life-result span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.life-result-lost {
  border-left-color: var(--color-danger);
  background: rgba(255, 93, 93, 0.07);
}

.life-result-lost strong {
  color: var(--color-danger);
  animation: life-loss-shake 380ms ease-out;
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
  margin: 0.4rem 0 0;
  color: #d8d9dd;
  font-size: clamp(0.74rem, 1.2vw, 0.9rem);
  line-height: 1.55;
}

.feedback-hint {
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
}

@media (max-width: 600px) {
  .feedback-card {
    width: calc(100vw - 0.8rem);
    max-height: 93dvh;
  }

  .guess-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    max-height: 96dvh;
    gap: 0.45rem;
    padding: 0.65rem;
  }

  .feedback-hint {
    display: none;
  }
}
</style>
