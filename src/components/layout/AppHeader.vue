<template>
  <header class="app-header">
    <a
      class="return-link"
      href="https://jivaro.net/games"
      target="_top"
      aria-label="Return to Games"
    >
      <span class="return-icon" aria-hidden="true">←</span>
      <span class="return-label">Games</span>
    </a>

    <div class="brand" aria-label="ChronoGame, Guess the Release Year">
      <div class="brand-name">
        <span>Chrono</span><span class="brand-accent">Game</span>
      </div>
      <div class="brand-subtitle">Guess the Release Year</div>
    </div>

    <div v-if="showScore" class="header-score" aria-label="Current total score">
      <span class="score-label">Score</span>
      <strong>{{ formattedScore }}</strong>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
    showScore: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    }
  },
  computed: {
    formattedScore() {
      return this.score.toLocaleString()
    }
  }
}
</script>

<style scoped>
.app-header {
  position: relative;
  z-index: var(--z-header);
  width: 100%;
  height: var(--header-height);
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 138, 50, 0.75);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 35%),
    linear-gradient(135deg, #111318 0%, #24272e 55%, #111318 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.48), 0 -1px 0 rgba(255, 255, 255, 0.04) inset;
}

.app-header::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  box-shadow: 0 0 15px rgba(255, 138, 50, 0.72);
}

.return-link,
.header-score {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.return-link {
  left: clamp(0.55rem, 2vw, 1.75rem);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.35rem;
  padding: 0.42rem 0.85rem;
  color: var(--color-text);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-small);
  background: linear-gradient(180deg, #343840, #1e2127);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.38), 0 1px 0 rgba(255, 255, 255, 0.09) inset;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.return-link:hover {
  color: #fff;
  border-color: rgba(255, 138, 50, 0.72);
  transform: translateY(calc(-50% - 2px));
  box-shadow: 0 9px 20px rgba(0, 0, 0, 0.48), 0 0 16px rgba(255, 138, 50, 0.2);
}

.return-icon {
  color: var(--color-accent-bright);
  font-size: 1.2rem;
  line-height: 1;
}

.return-label {
  font-size: clamp(0.72rem, 1.25vw, 0.92rem);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: max-content;
  max-width: 52%;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.brand-name {
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.045em;
  color: var(--color-text);
  text-shadow: var(--shadow-text), 0 0 17px rgba(255, 138, 50, 0.16);
}

.brand-accent {
  color: var(--color-accent-bright);
}

.brand-subtitle {
  margin-top: clamp(0.15rem, 0.55vh, 0.35rem);
  color: var(--color-text-muted);
  font-size: clamp(0.55rem, 1.1vw, 0.72rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.header-score {
  right: clamp(0.55rem, 2vw, 1.75rem);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.38rem 0.72rem;
  border: 1px solid rgba(255, 138, 50, 0.28);
  border-radius: var(--radius-small);
  background: rgba(5, 6, 8, 0.52);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.32) inset;
}

.score-label {
  color: var(--color-text-muted);
  font-size: clamp(0.6rem, 1vw, 0.75rem);
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.header-score strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.75rem, 1.5vw, 1rem);
}

@media (max-width: 520px) {
  .return-link {
    min-width: 2.4rem;
    justify-content: center;
    padding-inline: 0.6rem;
  }

  .return-label,
  .score-label,
  .brand-subtitle {
    display: none;
  }

  .brand {
    max-width: 48%;
  }

  .brand-name {
    font-size: clamp(0.92rem, 5.3vw, 1.3rem);
  }

  .header-score {
    padding-inline: 0.55rem;
  }
}
</style>
