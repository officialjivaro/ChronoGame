<template>
  <section class="results text-center">
    <h1 class="game-over-title">Game Over</h1>
    <p class="final-score">Your total score: {{ totalScore }}</p>
    <p class="thanks-text">
      Thanks for playing! Try again to see if you can top your previous score.
    </p>
    <button class="custom-btn mt-3" @click="playAgain">
      Play Again
    </button>
  </section>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ResultsView',
  computed: {
    ...mapState(['totalScore'])
  },
  methods: {
    playAgain() {
      this.$store.commit('resetGame')
      this.$store.dispatch('loadGames').then(() => {
        this.$store.dispatch('selectRandomGames')
        this.$router.push('/game')
      })
    }
  }
}
</script>

<style scoped>
.results {
  padding: 1rem;
  margin-top: 2rem;
}
.game-over-title {
  font-size: 3rem;
  font-weight: 800;
  color: #222;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.4);
  margin-bottom: 1rem;
}
.final-score {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.thanks-text {
  font-size: 1rem;
  color: #555;
  margin-bottom: 2rem;
}
</style>
