<template>
  <div class="game-image">
    <img v-if="game" :src="game.imageUrl" alt="Game Screenshot" />
    <p v-else>Could not load image or game not found.</p>
  </div>
</template>

<script>
export default {
  name: 'GameImage',
  props: ['game']
}
</script>

<style scoped>
.game-image {
  display: flex;
  justify-content: center;
}
.game-image img {
  width: 50vw;
  height: auto;
  max-width: none;
}
</style>
