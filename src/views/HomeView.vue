<template>
  <section class="home-view" aria-labelledby="home-title">
    <ArcadePanel class="home-card" :accent="true">
      <div class="home-copy">
        <span class="home-kicker">Arcade History Challenge</span>
        <h1 id="home-title">Test Your Game Knowledge</h1>
        <p class="home-description">
          Study five mystery screenshots, lock in their release years, and chase a perfect 5,000-point run.
        </p>

        <div class="rule-grid" aria-label="Game rules">
          <div class="rule-chip">
            <strong>5</strong>
            <span>Rounds</span>
          </div>
          <div class="rule-chip">
            <strong>1960–2030</strong>
            <span>Timeline</span>
          </div>
          <div class="rule-chip">
            <strong>1,000</strong>
            <span>Max per round</span>
          </div>
        </div>

        <div class="home-actions">
          <ArcadeButton
            size="large"
            :block="true"
            :pulse="true"
            :disabled="loading"
            @click="startGame"
          >
            {{ loading ? 'Loading Cabinet…' : 'Start Game' }}
          </ArcadeButton>
          <p class="score-hint">Closer guesses earn dramatically more points.</p>
          <p v-if="error" class="home-error" role="alert">{{ error }}</p>
        </div>
      </div>

      <div class="home-visual">
        <img :src="startImage" alt="ChronoGame arcade artwork" />
        <div class="visual-badge">
          <span>Player One</span>
          <strong>Ready</strong>
        </div>
      </div>
    </ArcadePanel>
  </section>
</template>

<script>
import gameStart from '../assets/images/game_start.png'
import ArcadeButton from '../components/common/ArcadeButton.vue'
import ArcadePanel from '../components/common/ArcadePanel.vue'

export default {
  name: 'HomeView',
  components: {
    ArcadeButton,
    ArcadePanel
  },
  data() {
    return {
      startImage: gameStart,
      loading: false,
      error: ''
    }
  },
  methods: {
    async startGame() {
      this.loading = true
      this.error = ''
      this.$store.commit('resetGame')

      try {
        await this.$store.dispatch('loadGames')
        await this.$store.dispatch('selectRandomGames')
        await this.$router.push('/game')
      } catch (error) {
        this.error = error.message || 'The arcade cabinet could not start. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.65rem, 2.2vw, 2rem);
  overflow: hidden;
}

.home-card {
  width: min(var(--content-max-width), 100%);
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(17rem, 0.85fr) minmax(0, 1.45fr);
  gap: clamp(0.8rem, 2.2vw, 2rem);
  padding: clamp(0.85rem, 2.2vw, 2rem);
  overflow: hidden;
}

.home-copy {
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.home-kicker {
  color: var(--color-accent-bright);
  font-size: clamp(0.62rem, 1vw, 0.78rem);
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.home-copy h1 {
  margin: 0.4rem 0 0.7rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 3.6rem);
  line-height: 1.03;
  letter-spacing: 0.02em;
  text-shadow: var(--shadow-text), 0 0 18px rgba(255, 138, 50, 0.14);
}

.home-description {
  max-width: 34rem;
  margin-bottom: var(--space-3);
  color: var(--color-text-muted);
  font-size: clamp(0.78rem, 1.4vw, 1rem);
  line-height: 1.6;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.rule-chip {
  min-width: 0;
  padding: clamp(0.5rem, 1.2vw, 0.8rem);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: 0 5px 13px rgba(0, 0, 0, 0.25) inset;
}

.rule-chip strong,
.rule-chip span {
  display: block;
}

.rule-chip strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.72rem, 1.5vw, 1rem);
}

.rule-chip span {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-size: clamp(0.52rem, 0.85vw, 0.65rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-actions {
  margin-top: var(--space-3);
}

.score-hint,
.home-error {
  margin: 0.65rem 0 0;
  text-align: center;
  font-size: clamp(0.62rem, 1vw, 0.75rem);
}

.score-hint {
  color: var(--color-text-muted);
}

.home-error {
  color: var(--color-danger);
}

.home-visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 3px solid #090a0c;
  background: #07080a;
  box-shadow:
    0 0 0 1px #4b4f58,
    0 0 0 5px #16191e,
    0 18px 42px rgba(0, 0, 0, 0.62),
    0 0 24px rgba(255, 138, 50, 0.14);
}

.home-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background: repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgba(0, 0, 0, 0.2) 5px);
  animation: scan-shift 6s linear infinite;
}

.home-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-badge {
  position: absolute;
  z-index: 2;
  left: var(--space-3);
  bottom: var(--space-3);
  padding: 0.55rem 0.8rem;
  border-left: 3px solid var(--color-accent);
  background: rgba(7, 8, 10, 0.82);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(5px);
}

.visual-badge span,
.visual-badge strong {
  display: block;
  text-transform: uppercase;
}

.visual-badge span {
  color: var(--color-text-muted);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
}

.visual-badge strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 0.92rem;
}

@media (max-width: 760px) {
  .home-card {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .home-copy {
    justify-content: flex-start;
  }

  .home-description {
    margin-bottom: 0.65rem;
  }

  .home-actions {
    margin-top: 0.7rem;
  }
}

@media (max-width: 420px) {
  .home-view {
    padding: 0.45rem;
  }

  .home-card {
    padding: 0.65rem;
  }

  .rule-chip {
    padding-inline: 0.25rem;
  }
}

@media (max-height: 640px) {
  .home-description {
    display: none;
  }

  .home-copy h1 {
    margin-bottom: 0.45rem;
  }

  .score-hint {
    display: none;
  }
}

</style>
