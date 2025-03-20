<!-- GameImage.vue -->
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
  align-items: center;
  flex: 1;
  overflow: hidden;
}
.game-image img {
  width: 45vw;
  max-width: 90%;
  height: auto;
  border: 6px ridge #333;
  box-shadow: 0 0 8px rgba(0,0,0,0.6), 0 8px 12px rgba(0,0,0,0.4);
  border-radius: 0;
}
</style>
