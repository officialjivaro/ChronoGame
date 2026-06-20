<template>
  <section v-if="availableHints.length" class="hint-controls" aria-label="Optional hints">
    <div class="hint-heading">
      <span>Hints</span>
      <strong>Maximum: {{ scoreCeiling }}</strong>
    </div>

    <div class="hint-list">
      <button
        v-for="hint in availableHints"
        :key="hint.id"
        type="button"
        :disabled="disabled || usedHints.includes(hint.id)"
        :class="['hint-button', { 'hint-button-used': usedHints.includes(hint.id) }]"
        @click="$emit('use-hint', hint.id)"
      >
        <span>{{ hint.label }}</span>
        <small v-if="!usedHints.includes(hint.id)">−{{ hint.penalty }} max</small>
        <strong v-else>{{ hintValue(hint.id) }}</strong>
      </button>
    </div>
  </section>
</template>

<script>
import { HINT_DEFINITIONS } from '../../config/gameModes.js'

export default {
  name: 'HintControls',
  props: {
    hintIds: {
      type: Array,
      default: () => []
    },
    usedHints: {
      type: Array,
      default: () => []
    },
    game: {
      type: Object,
      default: null
    },
    scoreCeiling: {
      type: Number,
      default: 1000
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['use-hint'],
  computed: {
    availableHints() {
      return this.hintIds.map((hintId) => HINT_DEFINITIONS[hintId]).filter(Boolean)
    }
  },
  methods: {
    hintValue(hintId) {
      if (!this.game) return 'Unavailable'
      if (hintId === 'platform') return this.game.platforms?.join(' / ') || 'Unknown'
      if (hintId === 'developer') return this.game.developer || 'Unknown'
      if (hintId === 'decade') return `${Math.floor(this.game.year / 10) * 10}s`
      return 'Revealed'
    }
  }
}
</script>

<style scoped>
.hint-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
}

.hint-heading span,
.hint-heading strong {
  display: block;
}

.hint-heading span {
  color: var(--color-text-muted);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hint-heading strong {
  margin-top: 0.12rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 0.65rem;
}

.hint-list {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
}

.hint-button {
  min-width: 0;
  min-height: 2.65rem;
  padding: 0.35rem 0.45rem;
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-small);
  background: linear-gradient(180deg, #353a43, #1c1f25);
  cursor: pointer;
}

.hint-button span,
.hint-button small,
.hint-button strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint-button span {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hint-button small {
  margin-top: 0.18rem;
  color: var(--color-text-muted);
  font-size: 0.5rem;
}

.hint-button strong {
  margin-top: 0.18rem;
  color: var(--color-accent-bright);
  font-size: clamp(0.5rem, 0.85vw, 0.65rem);
}

.hint-button:hover:not(:disabled) {
  border-color: var(--color-accent);
}

.hint-button-used {
  border-color: rgba(255, 138, 50, 0.38);
  background: rgba(255, 138, 50, 0.08);
}

.hint-button:disabled {
  cursor: default;
}

@media (max-width: 760px) {
  .hint-controls {
    grid-template-columns: 1fr;
  }

  .hint-heading {
    display: flex;
    justify-content: space-between;
  }
}
</style>
