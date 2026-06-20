<template>
  <section class="game-view" aria-label="ChronoGame round">
    <RoundStatus
      :mode-id="selectedMode"
      :mode-name="activeMode.name"
      :current-round="currentRound"
      :max-rounds="maxRounds"
      :total-score="totalScore"
      :current-streak="currentStreak"
      :best-streak="bestStreak"
      :lives="lives"
      :remaining-seconds="remainingSeconds"
      :timer-seconds="activeMode.timerSeconds"
      :completed-rounds="roundResults.length"
      :selected-decade="selectedDecade"
      :daily-date-key="dailyDateKey"
      :daily-practice="dailyPractice"
    />

    <div class="game-stage">
      <GameArtwork
        :key="artworkKey"
        :game="currentGame"
        :replacing="replacing"
        @ready="handleImageReady"
        @error="handleImageError"
        @retry="handleImageRetry"
        @replace="replaceGame"
      />
    </div>

    <ArcadePanel class="control-deck">
      <HintControls
        :hint-ids="activeMode.hints"
        :used-hints="usedHints"
        :game="currentGame"
        :score-ceiling="roundScoreCeiling"
        :disabled="hasSubmitted || !imageReady"
        @use-hint="useHint"
      />

      <div class="control-main">
        <YearSelector v-model="selectedYear" :disabled="hasSubmitted || !imageReady" />
        <ArcadeButton
          class="control-action"
          variant="primary"
          size="large"
          :disabled="actionDisabled"
          @click="handlePrimaryAction"
        >
          {{ buttonLabel }}
        </ArcadeButton>
      </div>
    </ArcadePanel>

    <transition name="modal-fade">
      <RoundFeedback
        v-if="showFeedback && currentRoundResult"
        :result="currentRoundResult"
        :game="currentGame"
        :mode-id="selectedMode"
        :compact="activeMode.compactFeedback"
        @close="closeFeedback"
      />
    </transition>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ArcadeButton from '../components/common/ArcadeButton.vue'
import ArcadePanel from '../components/common/ArcadePanel.vue'
import GameArtwork from '../components/game/GameArtwork.vue'
import HintControls from '../components/game/HintControls.vue'
import RoundFeedback from '../components/game/RoundFeedback.vue'
import RoundStatus from '../components/game/RoundStatus.vue'
import YearSelector from '../components/game/YearSelector.vue'
import { getGameKey } from '../utils/gameSelection.js'
import { preloadGames } from '../utils/imagePreloader.js'

export default {
  name: 'GameView',
  components: {
    ArcadeButton,
    ArcadePanel,
    GameArtwork,
    HintControls,
    RoundFeedback,
    RoundStatus,
    YearSelector
  },
  data() {
    return {
      selectedYear: 2000,
      showFeedback: false,
      currentRoundResult: null,
      hasSubmitted: false,
      replacing: false,
      timerInterval: null,
      timerDeadline: 0,
      autoAdvanceTimeout: null,
      navigating: false,
      finishing: false
    }
  },
  computed: {
    ...mapState([
      'selectedMode',
      'selectedDecade',
      'selectedGames',
      'currentRound',
      'maxRounds',
      'totalScore',
      'roundResults',
      'currentStreak',
      'bestStreak',
      'lives',
      'remainingSeconds',
      'runStatus',
      'usedHints',
      'roundScoreCeiling',
      'dailyDateKey',
      'dailyPractice',
      'imageReady'
    ]),
    ...mapGetters(['activeMode', 'currentGame']),
    artworkKey() {
      return `${this.currentRound}-${getGameKey(this.currentGame)}`
    },
    nextGame() {
      return this.selectedGames[this.currentRound + 1] || null
    },
    canSubmit() {
      return Boolean(this.currentGame && this.imageReady && this.runStatus === 'playing' && !this.replacing)
    },
    actionDisabled() {
      return this.hasSubmitted ? this.navigating : !this.canSubmit
    },
    roundWillEndRun() {
      if (this.selectedMode === 'survival' && this.lives <= 0) return true
      return this.currentRound + 1 >= this.selectedGames.length
    },
    buttonLabel() {
      if (!this.hasSubmitted) return this.imageReady ? 'Lock In' : 'Waiting for Image'
      return this.roundWillEndRun ? 'View Results' : 'Next Round'
    }
  },
  async mounted() {
    if (!this.selectedGames.length || this.runStatus !== 'playing') {
      await this.$router.replace('/')
      return
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.$store.dispatch('setImageReady', false)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.clearTimer()
    this.clearAutoAdvance()
  },
  methods: {
    handleImageReady(ready) {
      this.$store.dispatch('setImageReady', ready)

      if (ready) {
        preloadGames(this.nextGame ? [this.nextGame] : [], 1)

        if (this.selectedMode === 'timeAttack' && !document.hidden) {
          this.startTimer()
        }
      }
    },
    handleImageError() {
      if (this.selectedMode === 'timeAttack') {
        this.pauseTimer()
      }
    },
    handleImageRetry() {
      if (this.selectedMode === 'timeAttack') {
        this.pauseTimer()
      }
    },
    async replaceGame() {
      this.replacing = true
      this.clearAutoAdvance()

      try {
        await this.$store.dispatch('replaceCurrentGame')
        this.resetRoundPresentation()
      } catch (error) {
        this.currentRoundResult = null
        window.alert(error.message || 'No replacement game is available.')
      } finally {
        this.replacing = false
      }
    },
    useHint(hintId) {
      this.$store.dispatch('useHint', hintId)
    },
    handlePrimaryAction() {
      if (this.hasSubmitted) {
        this.advanceRound()
        return
      }

      this.submitGuess()
    },
    async submitGuess() {
      if (!this.canSubmit || this.hasSubmitted) return

      try {
        this.currentRoundResult = await this.$store.dispatch('submitRound', this.selectedYear)
        this.hasSubmitted = true
        this.showFeedback = true

        if (this.selectedMode === 'timeAttack') {
          this.scheduleAutoAdvance()
        }
      } catch (error) {
        window.alert(error.message || 'This round could not be scored.')
      }
    },
    closeFeedback() {
      this.clearAutoAdvance()
      this.showFeedback = false

      if (this.selectedMode === 'timeAttack') {
        this.advanceRound()
      }
    },
    scheduleAutoAdvance() {
      this.clearAutoAdvance()
      this.autoAdvanceTimeout = window.setTimeout(() => {
        this.showFeedback = false
        this.advanceRound()
      }, this.activeMode.autoAdvanceMs)
    },
    clearAutoAdvance() {
      if (this.autoAdvanceTimeout) {
        window.clearTimeout(this.autoAdvanceTimeout)
        this.autoAdvanceTimeout = null
      }
    },
    async advanceRound() {
      if (this.navigating || this.finishing) return
      this.navigating = true
      this.clearAutoAdvance()

      const outcome = await this.$store.dispatch('advanceRound')

      if (outcome.complete) {
        this.navigating = false
        await this.finishAndNavigate()
        return
      }

      this.resetRoundPresentation()
      this.navigating = false
    },
    resetRoundPresentation() {
      this.selectedYear = 2000
      this.showFeedback = false
      this.currentRoundResult = null
      this.hasSubmitted = false
      this.$store.dispatch('setImageReady', false)
    },
    startTimer() {
      if (this.selectedMode !== 'timeAttack' || this.timerInterval || this.remainingSeconds <= 0 || this.runStatus !== 'playing') {
        return
      }

      this.timerDeadline = Date.now() + this.remainingSeconds * 1000
      this.timerInterval = window.setInterval(this.tickTimer, 100)
    },
    tickTimer() {
      const remaining = Math.max(0, (this.timerDeadline - Date.now()) / 1000)
      this.$store.dispatch('updateTimer', remaining)

      if (remaining <= 0) {
        this.clearTimer()
        this.clearAutoAdvance()
        this.finishAndNavigate()
      }
    },
    pauseTimer() {
      if (!this.timerInterval) return
      const remaining = Math.max(0, (this.timerDeadline - Date.now()) / 1000)
      this.$store.dispatch('updateTimer', remaining)
      this.clearTimer()
    },
    clearTimer() {
      if (this.timerInterval) {
        window.clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },
    handleVisibilityChange() {
      if (this.selectedMode !== 'timeAttack') return

      if (document.hidden) {
        this.pauseTimer()
      } else if (this.imageReady) {
        this.startTimer()
      }
    },
    async finishAndNavigate() {
      if (this.finishing) return
      this.finishing = true
      this.navigating = true
      this.clearTimer()
      this.clearAutoAdvance()
      await this.$store.dispatch('finishRun')
      await this.$router.push('/results')
    }
  }
}
</script>

<style scoped>
.game-view {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: clamp(0.4rem, 1vh, 0.75rem);
  padding: clamp(0.4rem, 1.1vw, 0.8rem) clamp(0.45rem, 1.5vw, 1.15rem);
  overflow: hidden;
}

.game-stage {
  width: min(var(--content-max-width), 100%);
  min-height: 0;
  margin: 0 auto;
}

.control-deck {
  width: min(var(--content-max-width), 100%);
  display: grid;
  gap: clamp(0.45rem, 0.9vh, 0.7rem);
  margin: 0 auto;
  padding: clamp(0.55rem, 1.1vw, 0.8rem);
}

.control-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(0.6rem, 1.4vw, 1rem);
}

.control-action {
  min-width: clamp(9rem, 16vw, 13rem);
}

@media (max-width: 720px) {
  .game-view {
    padding: 0.35rem;
  }

  .control-main {
    grid-template-columns: 1fr;
  }

  .control-action {
    width: 100%;
    min-width: 0;
  }
}

@media (max-height: 650px) {
  .control-deck {
    gap: 0.3rem;
    padding: 0.45rem;
  }
}
</style>
