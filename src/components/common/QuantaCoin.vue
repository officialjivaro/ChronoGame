<template>
  <span :class="['quanta-coin', `quanta-coin-${size}`]" aria-hidden="true">Q</span>
  <span class="sr-only">Quanta</span>
</template>

<script>
export default {
  name: 'QuantaCoin',
  props: {
    size: {
      type: String,
      default: 'small'
    }
  }
}
</script>

<style scoped>
.quanta-coin {
  position: relative;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  color: #3b2605;
  font-family: var(--font-display);
  font-weight: 900;
  line-height: 1;
  border: 1px solid var(--color-quanta-highlight);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.82), transparent 18%),
    linear-gradient(145deg, var(--color-quanta-highlight), var(--color-quanta), var(--color-quanta-shadow));
  box-shadow:
    0 2px 0 #784d0c,
    0 6px 12px rgba(0, 0, 0, 0.36),
    0 0 13px rgba(255, 190, 72, 0.22),
    0 1px 0 rgba(255, 255, 255, 0.65) inset;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.36);
}

.quanta-coin::after {
  content: '';
  position: absolute;
  inset: 12%;
  border: 1px solid rgba(89, 52, 5, 0.35);
  border-radius: 50%;
}

.quanta-coin-small {
  width: 1.35rem;
  height: 1.35rem;
  font-size: 0.7rem;
}

.quanta-coin-medium {
  width: 2rem;
  height: 2rem;
  font-size: 1rem;
}

.quanta-coin-large {
  width: clamp(2.8rem, 7vw, 4rem);
  height: clamp(2.8rem, 7vw, 4rem);
  font-size: clamp(1.2rem, 3vw, 1.9rem);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
