<template>
  <section class="personal-stats" aria-label="Local player statistics">
    <div class="stat-item">
      <span>Classic Best</span>
      <strong>{{ stats.classicBestScore.toLocaleString() }}</strong>
    </div>
    <div class="stat-item">
      <span>Average Miss</span>
      <strong>{{ averageYears }} yrs</strong>
    </div>
    <div class="stat-item">
      <span>Best Streak</span>
      <strong>{{ stats.bestAccuracyStreak }}</strong>
    </div>
    <div class="stat-item">
      <span>Daily Streak</span>
      <strong>{{ stats.dailyStreak }}</strong>
    </div>
  </section>
</template>

<script>
import { getAverageYearsOff } from '../../utils/storage.js'

export default {
  name: 'PersonalStats',
  props: {
    stats: {
      type: Object,
      required: true
    }
  },
  computed: {
    averageYears() {
      return getAverageYearsOff(this.stats).toFixed(1)
    }
  }
}
</script>

<style scoped>
.personal-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
}

.stat-item {
  min-width: 0;
  padding: 0.42rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.2);
}

.stat-item span,
.stat-item strong {
  display: block;
}

.stat-item span {
  color: var(--color-text-muted);
  font-size: clamp(0.62rem, 0.75vw, 0.68rem);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stat-item strong {
  margin-top: 0.15rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.72rem, 1.1vw, 0.9rem);
}
</style>
