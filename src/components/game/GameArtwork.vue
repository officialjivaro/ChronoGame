<template>
  <ArcadePanel class="game-artwork" :accent="true" :flush="true">
    <div class="artwork-frame">
      <div v-if="!game" class="artwork-state">
        <strong>No game loaded</strong>
        <span>Return to the title screen and start a new run.</span>
      </div>

      <div v-else-if="imageError" class="artwork-state artwork-error" role="alert">
        <strong>Image signal lost</strong>
        <span>The screenshot could not be loaded from its host.</span>
        <div class="artwork-actions">
          <button v-if="retryCount === 0" type="button" @click="retryImage">Retry</button>
          <button v-else type="button" :disabled="replacing" @click="$emit('replace')">
            {{ replacing ? 'Finding Replacement…' : 'Replace Game' }}
          </button>
        </div>
      </div>

      <template v-else>
        <div v-if="!imageLoaded" class="artwork-state" aria-live="polite">
          <span class="loading-ring" aria-hidden="true"></span>
          <strong>Loading mystery game</strong>
        </div>
        <img
          v-show="imageLoaded"
          :key="imageKey"
          :src="imageSource"
          alt="Mystery game screenshot"
          @load="handleLoad"
          @error="handleError"
        />
      </template>

      <span class="frame-corner frame-corner-top-left" aria-hidden="true"></span>
      <span class="frame-corner frame-corner-top-right" aria-hidden="true"></span>
      <span class="frame-corner frame-corner-bottom-left" aria-hidden="true"></span>
      <span class="frame-corner frame-corner-bottom-right" aria-hidden="true"></span>
    </div>
  </ArcadePanel>
</template>

<script>
import ArcadePanel from '../common/ArcadePanel.vue'

export default {
  name: 'GameArtwork',
  components: {
    ArcadePanel
  },
  props: {
    game: {
      type: Object,
      default: null
    },
    replacing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['ready', 'error', 'retry', 'replace'],
  data() {
    return {
      imageLoaded: false,
      imageError: false,
      retryCount: 0,
      imageKey: 0
    }
  },
  computed: {
    imageSource() {
      if (!this.game?.imageUrl) return ''
      if (!this.retryCount) return this.game.imageUrl
      const separator = this.game.imageUrl.includes('?') ? '&' : '?'
      return `${this.game.imageUrl}${separator}chronogameRetry=${this.imageKey}`
    }
  },
  watch: {
    game: {
      immediate: true,
      handler() {
        this.imageLoaded = false
        this.imageError = false
        this.retryCount = 0
        this.imageKey += 1
        this.$emit('ready', false)
      }
    }
  },
  methods: {
    handleLoad() {
      this.imageLoaded = true
      this.imageError = false
      this.$emit('ready', true)
    },
    handleError() {
      this.imageLoaded = false
      this.imageError = true
      this.$emit('ready', false)
      this.$emit('error', { retryCount: this.retryCount })
    },
    retryImage() {
      this.retryCount += 1
      this.imageKey += 1
      this.imageLoaded = false
      this.imageError = false
      this.$emit('retry')
      this.$emit('ready', false)
    }
  }
}
</script>

<style scoped>
.game-artwork {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.artwork-frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 1.1vw, 0.9rem);
  overflow: hidden;
  border: 3px solid #090a0c;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.04), transparent 25%),
    #07080a;
  box-shadow:
    0 0 0 1px #4a4e57 inset,
    0 0 0 5px #15181d inset,
    0 18px 34px rgba(0, 0, 0, 0.58) inset;
}

.artwork-frame img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border: 1px solid #090a0c;
  box-shadow:
    0 0 0 2px #4b4f57,
    0 0 0 5px #17191e,
    0 14px 38px rgba(0, 0, 0, 0.78),
    0 0 22px rgba(255, 138, 50, 0.15);
}

.artwork-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  max-width: 26rem;
  padding: 1rem;
  color: var(--color-text-muted);
  text-align: center;
}

.artwork-state strong {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(0.82rem, 1.6vw, 1.1rem);
}

.artwork-actions {
  display: flex;
  gap: 0.5rem;
}

.artwork-actions button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  color: var(--color-text);
  border: 1px solid rgba(255, 138, 50, 0.55);
  border-radius: var(--radius-small);
  background: linear-gradient(180deg, #3b4049, #1d2026);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.artwork-actions button:disabled {
  opacity: 0.45;
  cursor: wait;
}

.loading-ring {
  width: 2.2rem;
  aspect-ratio: 1;
  border: 3px solid rgba(255, 255, 255, 0.13);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: loader-spin 0.8s linear infinite;
}

.frame-corner {
  position: absolute;
  width: clamp(1rem, 2vw, 1.8rem);
  height: clamp(1rem, 2vw, 1.8rem);
  pointer-events: none;
}

.frame-corner-top-left {
  top: 0.45rem;
  left: 0.45rem;
  border-top: 2px solid var(--color-accent);
  border-left: 2px solid var(--color-accent);
}

.frame-corner-top-right {
  top: 0.45rem;
  right: 0.45rem;
  border-top: 2px solid var(--color-accent);
  border-right: 2px solid var(--color-accent);
}

.frame-corner-bottom-left {
  bottom: 0.45rem;
  left: 0.45rem;
  border-bottom: 2px solid var(--color-accent);
  border-left: 2px solid var(--color-accent);
}

.frame-corner-bottom-right {
  right: 0.45rem;
  bottom: 0.45rem;
  border-right: 2px solid var(--color-accent);
  border-bottom: 2px solid var(--color-accent);
}
</style>
