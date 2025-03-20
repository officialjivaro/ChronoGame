<!-- HomeView.vue -->
<template>
  <section class="home text-center mt-4">
    <h2>Test Your Game Knowledge</h2>
    <img :src="startImage" alt="Start" class="start-image" />
    <button class="custom-btn bigger-btn mt-3" @click="startGame">
      Play
    </button>
  </section>
</template>

<script>
import gameStart from '../assets/images/game_start.png'

export default {
  name: 'HomeView',
  data() {
    return {
      startImage: gameStart
    }
  },
  methods: {
    startGame() {
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
.home {
  padding: 1rem;
}
.home h2 {
  text-shadow: 2px 2px 5px rgba(0,0,0,0.6);
}
.start-image {
  display: block;
  width: 50%;
  margin: 1rem auto 1.5rem auto;
}
</style>
