<!-- ScorePanel.vue -->
<template>
  <div class="score-panel">
    <div class="panel-content">
      <h3 :style="{ color: scoreColor }">Your Score: {{ score }}</h3>
      <p>
        <strong>{{ gameInfo.title }}</strong>
      </p>
      <p>Release Year: {{ gameInfo.year }}</p>
      <p>
        Developer: {{ gameInfo.developer }}<br />
        Publisher: {{ gameInfo.publisher }}
      </p>
      <p v-if="score >= 400">{{ gameInfo.facts }}</p>
      <p v-else>Aww, you didn't get 400 points, so no game facts for you. Better luck next time!</p>
      <button @click="$emit('close-panel')">X</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScorePanel',
  props: ['score', 'game'],
  computed: {
    gameInfo() {
      return this.game || {}
    },
    scoreColor() {
      if (this.score === 1000) return 'green'
      if (this.score >= 745) return 'lightgreen'
      if (this.score >= 500) return 'yellow'
      if (this.score >= 250) return 'orange'
      return 'red'
    }
  }
}
</script>

<style scoped>
.score-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.panel-content {
  background-color: #fff;
  padding: 1rem;
  border-radius: 6px;
  text-align: left;
  width: 35%;
  max-width: none;
}
button {
  margin-top: 1rem;
  cursor: pointer;
}
</style>
