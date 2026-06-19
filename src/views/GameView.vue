<template>
  <section class="game-view" aria-label="ChronoGame round">
    <RoundStatus
      :current-round="currentRound"
      :max-rounds="maxRounds"
      :total-score="totalScore"
    />

    <div class="game-stage">
      <GameArtwork :key="currentRound" :game="currentGame" />
    </div>

    <ArcadePanel class="control-deck">
      <YearSelector v-model="selectedYear" />
      <ArcadeButton
        class="control-action"
        variant="primary"
        size="large"
        :disabled="!currentGame"
        @click="handlePrimaryAction"
      >
        {{ hasSubmitted ? 'Next Round' : 'Lock In' }}
      </ArcadeButton>
    </ArcadePanel>

    <transition name="modal-fade">
      <RoundFeedback
        v-if="showFacts"
        :score="thisRoundScore"
        :game="currentGame"
        @close="closeFacts"
      />
    </transition>
  </section>
</template>

<script>
import { mapState } from 'vuex'
import ArcadeButton from '../components/common/ArcadeButton.vue'
import ArcadePanel from '../components/common/ArcadePanel.vue'
import GameArtwork from '../components/game/GameArtwork.vue'
import RoundFeedback from '../components/game/RoundFeedback.vue'
import RoundStatus from '../components/game/RoundStatus.vue'
import YearSelector from '../components/game/YearSelector.vue'
import { calculateRoundScore } from '../utils/scoring.js'

export default {
  name: 'GameView',
  components: {
    ArcadeButton,
    ArcadePanel,
    GameArtwork,
    RoundFeedback,
    RoundStatus,
    YearSelector
  },
  data() {
    return {
      selectedYear: 2000,
      showFacts: false,
      thisRoundScore: 0,
      hasSubmitted: false
    }
  },
  computed: {
    ...mapState(['selectedGames', 'currentRound', 'maxRounds', 'totalScore']),
    currentGame() {
      return this.selectedGames[this.currentRound] || null
    }
  },
  mounted() {
    if (!this.selectedGames.length) {
      this.$router.replace('/')
    }
  },
  methods: {
    handlePrimaryAction() {
      if (this.hasSubmitted) {
        this.goNext()
        return
      }
      this.submitGuess()
    },
    submitGuess() {
      if (!this.currentGame) return

      this.thisRoundScore = calculateRoundScore(
        this.selectedYear,
        this.currentGame.year
      )
      this.$store.commit('addScore', this.thisRoundScore)
      this.showFacts = true
      this.hasSubmitted = true
    },
    closeFacts() {
      this.showFacts = false
    },
    goNext() {
      this.showFacts = false
      this.hasSubmitted = false
      this.thisRoundScore = 0

      if (this.currentRound + 1 < this.selectedGames.length) {
        this.$store.commit('incrementRound')
        this.selectedYear = 2000
      } else {
        this.$router.push('/results')
      }
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
  gap: clamp(0.5rem, 1.3vh, 0.9rem);
  padding: clamp(0.5rem, 1.4vw, 1rem) clamp(0.55rem, 2vw, 1.5rem);
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
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(0.7rem, 2vw, 1.5rem);
  margin: 0 auto;
  padding: clamp(0.65rem, 1.5vw, 1rem);
}

.control-action {
  width: clamp(9rem, 15vw, 13rem);
}

@media (max-width: 720px) {
  .game-view {
    gap: 0.45rem;
    padding: 0.45rem;
  }

  .control-deck {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .control-action {
    width: 100%;
  }
}

@media (max-height: 620px) and (min-width: 721px) {
  .control-deck {
    padding-block: 0.45rem;
  }
}
</style>
