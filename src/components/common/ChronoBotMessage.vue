<template>
  <div :class="['chronobot-message', `chronobot-${mood}`, { 'chronobot-compact': compact }]">
    <div class="chronobot-face" aria-hidden="true">
      <span class="chronobot-eye"></span>
      <span class="chronobot-eye"></span>
      <span class="chronobot-mouth"></span>
    </div>
    <p><slot>{{ message }}</slot></p>
  </div>
</template>

<script>
export default {
  name: 'ChronoBotMessage',
  props: {
    message: {
      type: String,
      default: ''
    },
    mood: {
      type: String,
      default: 'neutral'
    },
    compact: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.chronobot-message {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  padding: 0.65rem 0.75rem;
  color: var(--color-text-muted);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.2);
}

.chronobot-message p {
  min-width: 0;
  margin: 0;
  font-size: clamp(0.62rem, 1vw, 0.78rem);
  line-height: 1.4;
}

.chronobot-face {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 0.35rem);
  grid-template-rows: 0.35rem 0.25rem;
  flex: 0 0 auto;
  gap: 0.18rem 0.3rem;
  width: 2rem;
  height: 1.7rem;
  place-content: center;
  border: 1px solid var(--color-chronobot);
  border-radius: 0.45rem;
  background: linear-gradient(180deg, #343943, #171a20);
  box-shadow: 0 0 12px rgba(118, 205, 255, 0.16);
}

.chronobot-face::before,
.chronobot-face::after {
  content: '';
  position: absolute;
  top: 0.58rem;
  width: 0.28rem;
  height: 0.5rem;
  border: 1px solid #505762;
  background: #171a20;
}

.chronobot-face::before {
  left: -0.3rem;
  border-radius: 0.2rem 0 0 0.2rem;
}

.chronobot-face::after {
  right: -0.3rem;
  border-radius: 0 0.2rem 0.2rem 0;
}

.chronobot-eye {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: var(--color-chronobot);
  box-shadow: 0 0 6px rgba(118, 205, 255, 0.62);
  animation: chronobot-blink 4.8s ease-in-out infinite;
}

.chronobot-mouth {
  grid-column: 1 / -1;
  width: 0.55rem;
  height: 0.12rem;
  justify-self: center;
  border-radius: 999px;
  background: var(--color-quanta);
}

.chronobot-rewarded {
  border-color: rgba(255, 190, 72, 0.28);
}

.chronobot-warning .chronobot-eye {
  background: var(--color-warning);
}

.chronobot-error .chronobot-eye {
  background: var(--color-danger);
}

.chronobot-compact {
  padding: 0.45rem 0.55rem;
}

.chronobot-compact .chronobot-face {
  transform: scale(0.86);
  transform-origin: center;
}
</style>
