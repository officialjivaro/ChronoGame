<template>
  <div class="year-selector" :class="{ 'year-selector-disabled': disabled }">
    <div class="year-readout">
      <span>Selected Year</span>
      <output :for="inputId">{{ localYear }}</output>
    </div>

    <div class="year-controls">
      <button
        class="year-step"
        type="button"
        :disabled="disabled || localYear <= min"
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
          :disabled="disabled"
          aria-label="Choose a release year"
          @input="handleInput"
        />
        <div class="range-limits" aria-hidden="true">
          <span>{{ min }}</span>
          <span>Use arrow keys for fine control</span>
          <span>{{ max }}</span>
        </div>
      </div>

      <button
        class="year-step"
        type="button"
        :disabled="disabled || localYear >= max"
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
    },
    disabled: {
      type: Boolean,
      default: false
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
      if (this.disabled) return
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
  gap: clamp(0.65rem, 1.5vw, 1.1rem);
}

.year-readout {
  min-width: clamp(5.8rem, 10vw, 8rem);
  text-align: center;
}

.year-readout span {
  display: block;
  color: var(--color-text-muted);
  font-size: clamp(0.65rem, 0.85vw, 0.72rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.year-readout output {
  display: block;
  min-width: 5ch;
  margin-top: 0.08rem;
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 3vw, 2.25rem);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px rgba(255, 138, 50, 0.32);
}

.year-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(0.45rem, 1vw, 0.75rem);
}

.year-step {
  width: clamp(2.75rem, 4vw, 3.2rem);
  height: clamp(2.75rem, 4vw, 3.2rem);
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
  height: 0.5rem;
  appearance: none;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  touch-action: pan-y;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.62) inset, 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.year-range::-webkit-slider-thumb {
  width: clamp(1.45rem, 2.4vw, 1.8rem);
  height: clamp(1.45rem, 2.4vw, 1.8rem);
  appearance: none;
  border: 2px solid #ffe0c3;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-accent-bright), var(--color-accent-dark));
  box-shadow: 0 0 0 4px rgba(255, 138, 50, 0.15), 0 4px 10px rgba(0, 0, 0, 0.55);
  cursor: grab;
}

.year-range::-moz-range-thumb {
  width: clamp(1.45rem, 2.4vw, 1.8rem);
  height: clamp(1.45rem, 2.4vw, 1.8rem);
  border: 2px solid #ffe0c3;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--color-accent-bright), var(--color-accent-dark));
  box-shadow: 0 0 0 4px rgba(255, 138, 50, 0.15), 0 4px 10px rgba(0, 0, 0, 0.55);
  cursor: grab;
}

.range-limits {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.35rem;
  margin-top: 0.35rem;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  font-size: clamp(0.63rem, 0.8vw, 0.69rem);
}

.range-limits span:nth-child(2) {
  text-align: center;
  font-family: var(--font-body);
  letter-spacing: 0.03em;
}

.year-selector-disabled {
  opacity: 0.55;
}

@media (max-width: 680px) {
  .year-selector {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .year-readout {
    min-width: 0;
  }

  .range-limits span:nth-child(2) {
    display: none;
  }

  .range-limits {
    grid-template-columns: auto 1fr;
  }

  .range-limits span:last-child {
    text-align: right;
  }
}

@media (max-height: 620px) {
  .year-readout span,
  .range-limits {
    display: none;
  }

  .year-readout output {
    font-size: 1.25rem;
  }
}
</style>
