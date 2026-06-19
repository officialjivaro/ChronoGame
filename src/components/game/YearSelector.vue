<template>
  <div class="year-selector">
    <div class="year-readout">
      <span>Selected Year</span>
      <output :for="inputId">{{ localYear }}</output>
    </div>

    <div class="year-controls">
      <button
        class="year-step"
        type="button"
        :disabled="localYear <= min"
        aria-label="Decrease year by one"
        @click="adjustYear(-1)"
      >
        −
      </button>

      <div class="range-column">
        <input
          :id="inputId"
          class="year-range"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="localYear"
          :style="rangeStyle"
          aria-label="Choose a release year"
          @input="handleInput"
        />
        <div class="range-limits" aria-hidden="true">
          <span>{{ min }}</span>
          <span>{{ max }}</span>
        </div>
      </div>

      <button
        class="year-step"
        type="button"
        :disabled="localYear >= max"
        aria-label="Increase year by one"
        @click="adjustYear(1)"
      >
        +
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YearSelector',
  props: {
    modelValue: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: 1960
    },
    max: {
      type: Number,
      default: 2030
    },
    step: {
      type: Number,
      default: 1
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localYear: this.modelValue,
      inputId: `year-range-${Math.random().toString(36).slice(2, 8)}`
    }
  },
  computed: {
    progress() {
      return ((this.localYear - this.min) / (this.max - this.min)) * 100
    },
    rangeStyle() {
      return {
        background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) ${this.progress}%, #3a3e46 ${this.progress}%, #3a3e46 100%)`
      }
    }
  },
  watch: {
    modelValue(value) {
      this.localYear = value
    }
  },
  methods: {
    emitYear(value) {
      const clamped = Math.min(this.max, Math.max(this.min, value))
      this.localYear = clamped
      this.$emit('update:modelValue', clamped)
    },
    handleInput(event) {
      this.emitYear(Number(event.target.value))
    },
    adjustYear(amount) {
      this.emitYear(this.localYear + amount)
    }
  }
}
</script>

<style scoped>
.year-selector {
  min-width: 0;
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
}

.year-readout {
  min-width: clamp(6rem, 11vw, 8.5rem);
  text-align: center;
}

.year-readout span {
  display: block;
  color: var(--color-text-muted);
  font-size: clamp(0.58rem, 0.9vw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.year-readout output {
  display: block;
  margin-top: 0.1rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 3.4vw, 2.5rem);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px rgba(255, 138, 50, 0.32);
}

.year-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(0.55rem, 1.2vw, 0.9rem);
}

.year-step {
  width: clamp(2.3rem, 4vw, 3rem);
  aspect-ratio: 1;
  color: var(--color-text);
  border: 1px solid #555b65;
  border-radius: var(--radius-small);
  background: linear-gradient(180deg, #3f444d, #22252b);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.38), 0 1px 0 rgba(255, 255, 255, 0.1) inset;
  cursor: pointer;
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 800;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.year-step:hover:not(:disabled) {
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.year-step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.range-column {
  min-width: 0;
}

.year-range {
  width: 100%;
  height: 0.45rem;
  appearance: none;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.62) inset, 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.year-range::-webkit-slider-thumb {
  width: clamp(1.2rem, 2vw, 1.55rem);
  aspect-ratio: 1;
  appearance: none;
  border: 2px solid #ffe0c3;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-accent-bright), var(--color-accent-dark));
  box-shadow: 0 0 0 4px rgba(255, 138, 50, 0.15), 0 4px 10px rgba(0, 0, 0, 0.55);
  cursor: grab;
}

.year-range::-moz-range-thumb {
  width: clamp(1.2rem, 2vw, 1.55rem);
  height: clamp(1.2rem, 2vw, 1.55rem);
  border: 2px solid #ffe0c3;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-accent-bright), var(--color-accent-dark));
  box-shadow: 0 0 0 4px rgba(255, 138, 50, 0.15), 0 4px 10px rgba(0, 0, 0, 0.55);
  cursor: grab;
}

.range-limits {
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  font-size: clamp(0.55rem, 0.9vw, 0.68rem);
}

@media (max-width: 680px) {
  .year-selector {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .year-readout {
    min-width: 0;
  }
}

@media (max-height: 620px) {
  .year-readout span,
  .range-limits {
    display: none;
  }

  .year-readout output {
    font-size: 1.35rem;
  }
}

</style>
