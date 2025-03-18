<template>
  <div class="score-panel">
    <div class="panel-content">
      <h3>Your Score: {{ score }}</h3>
      <p>
        <strong>{{ gameInfo.title }}</strong>
      </p>
      <p>
        Developer: {{ gameInfo.developer }}<br />
        Publisher: {{ gameInfo.publisher }}
      </p>
      <p>{{ gameInfo.facts }}</p>
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
  max-width: 300px;
}
button {
  margin-top: 1rem;
  cursor: pointer;
}
</style>
