<template>
  <section class="home-view" aria-labelledby="home-title">
    <ArcadePanel class="home-card" :accent="true">
      <div class="home-visual">
        <img :src="startImage" alt="ChronoGame arcade artwork" />
        <div class="visual-badge">
          <span>Player One</span>
          <strong>{{ selectedModeName }}</strong>
        </div>
      </div>

      <div class="home-copy">
        <div class="home-intro">
          <span class="home-kicker">Arcade History Challenge</span>
          <h1 id="home-title">Test Your Game Knowledge</h1>
          <p class="home-description">
            Pick a mode, study the screenshots, and lock in the years before the timeline gets suspicious.
          </p>
        </div>

        <ModeSelector
          v-model="selectedModeId"
          v-model:selectedDecade="selectedDecade"
          :decade-availability="decadeAvailability"
        />

        <PersonalStats :stats="playerStats" />

        <div class="home-actions">
          <ArcadeButton
            size="large"
            :block="true"
            :pulse="true"
            :disabled="loading || !canStart"
            @click="startGame"
          >
            {{ loading ? 'Loading Cabinet…' : startButtonLabel }}
          </ArcadeButton>
          <p v-if="error" class="home-error" role="alert">{{ error }}</p>
        </div>
      </div>
    </ArcadePanel>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import gameStart from '../assets/images/game_start.png'
import ArcadeButton from '../components/common/ArcadeButton.vue'
import ArcadePanel from '../components/common/ArcadePanel.vue'
import ModeSelector from '../components/home/ModeSelector.vue'
import PersonalStats from '../components/home/PersonalStats.vue'
import { GAME_MODES } from '../config/gameModes.js'

export default {
  name: 'HomeView',
  components: {
    ArcadeButton,
    ArcadePanel,
    ModeSelector,
    PersonalStats
  },
  data() {
    return {
      startImage: gameStart,
      selectedModeId: 'classic',
      selectedDecade: null,
      loading: false,
      error: ''
    }
  },
  computed: {
    ...mapState(['playerStats']),
    ...mapGetters(['decadeAvailability', 'eligibleDecades']),
    selectedMode() {
      return GAME_MODES[this.selectedModeId] || GAME_MODES.classic
    },
    selectedModeName() {
      return this.selectedMode.name
    },
    canStart() {
      return !this.selectedMode.requiresDecade || Number.isInteger(this.selectedDecade)
    },
    startButtonLabel() {
      return this.selectedModeId === 'daily' ? 'Start Today’s Challenge' : `Start ${this.selectedMode.name}`
    }
  },
  watch: {
    selectedModeId() {
      this.error = ''
      this.ensureDecadeSelection()
    },
    eligibleDecades() {
      this.ensureDecadeSelection()
    }
  },
  async mounted() {
    this.loading = true

    try {
      await this.$store.dispatch('loadGames')
      await this.$store.dispatch('loadPlayerStats')
      this.ensureDecadeSelection()
    } catch (error) {
      this.error = error.message || 'The game database could not be loaded.'
    } finally {
      this.loading = false
    }
  },
  methods: {
    ensureDecadeSelection() {
      if (!this.selectedMode.requiresDecade) return

      const selectedIsEligible = this.eligibleDecades.some((item) => item.decade === this.selectedDecade)

      if (!selectedIsEligible) {
        this.selectedDecade = this.eligibleDecades[0]?.decade ?? null
      }
    },
    async startGame() {
      if (!this.canStart) return

      this.loading = true
      this.error = ''

      try {
        await this.$store.dispatch('startRun', {
          modeId: this.selectedModeId,
          decade: this.selectedDecade
        })
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
  padding: clamp(0.5rem, 1.6vw, 1.35rem);
  overflow: hidden;
}

.home-card {
  width: min(var(--content-max-width), 100%);
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(22rem, 1fr);
  gap: clamp(0.65rem, 1.5vw, 1.25rem);
  padding: clamp(0.65rem, 1.5vw, 1.25rem);
  overflow: hidden;
}

.home-copy {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto auto auto;
  align-content: center;
  gap: clamp(0.45rem, 1vh, 0.75rem);
}

.home-kicker {
  color: var(--color-accent-bright);
  font-size: clamp(0.55rem, 0.9vw, 0.72rem);
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.home-copy h1 {
  margin: 0.25rem 0 0.35rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 3.2vw, 2.75rem);
  line-height: 1.02;
  text-shadow: var(--shadow-text), 0 0 18px rgba(255, 138, 50, 0.14);
}

.home-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: clamp(0.66rem, 1vw, 0.82rem);
  line-height: 1.45;
}

.home-actions {
  display: grid;
  gap: 0.35rem;
}

.home-error {
  margin: 0;
  color: var(--color-danger);
  text-align: center;
  font-size: 0.7rem;
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
  padding: 0.5rem 0.75rem;
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
  font-size: 0.54rem;
  letter-spacing: 0.14em;
}

.visual-badge strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .home-card {
    grid-template-columns: 0.72fr 1.28fr;
  }
}

@media (max-width: 760px) {
  .home-card {
    grid-template-columns: 1fr;
  }

  .home-visual {
    display: none;
  }

  .home-copy {
    align-content: center;
  }
}

@media (max-height: 650px) and (min-width: 761px) {
  .home-description,
  .personal-stats {
    display: none;
  }
}

@media (max-width: 420px) {
  .home-view,
  .home-card {
    padding: 0.45rem;
  }
}
</style>
