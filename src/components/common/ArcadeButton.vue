<template>
  <component
    :is="tagName"
    :href="tagName === 'a' ? href : undefined"
    :target="tagName === 'a' ? target : undefined"
    :type="tagName === 'button' ? type : undefined"
    :disabled="tagName === 'button' ? disabled : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled && tagName === 'a' ? -1 : undefined"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span class="button-content"><slot></slot></span>
  </component>
</template>

<script>
export default {
  name: 'ArcadeButton',
  props: {
    href: {
      type: String,
      default: ''
    },
    target: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'button'
    },
    variant: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'medium'
    },
    block: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    pulse: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  computed: {
    tagName() {
      return this.href ? 'a' : 'button'
    },
    buttonClasses() {
      return [
        'arcade-button',
        `arcade-button-${this.variant}`,
        `arcade-button-${this.size}`,
        {
          'arcade-button-block': this.block,
          'arcade-button-pulse': this.pulse,
          'arcade-button-disabled': this.disabled
        }
      ]
    }
  },
  methods: {
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault()
        return
      }
      this.$emit('click', event)
    }
  }
}
</script>

<style scoped>
.arcade-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 7.5rem;
  color: var(--color-text);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-family: var(--font-display);
  font-weight: 800;
  border: 1px solid transparent;
  border-radius: var(--radius-small);
  cursor: pointer;
  user-select: none;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.12) inset;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

.arcade-button::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: calc(var(--radius-small) - 2px);
  pointer-events: none;
}

.arcade-button:hover {
  color: #fff;
  transform: translateY(-2px);
}

.arcade-button:active {
  transform: translateY(1px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.35), 0 2px 5px rgba(0, 0, 0, 0.3) inset;
}

.arcade-button-primary {
  color: #18100b;
  border-color: #ffba7d;
  background: linear-gradient(180deg, #ffb56f 0%, #ff8a32 52%, #d95a14 100%);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
}

.arcade-button-primary:hover {
  background: linear-gradient(180deg, #ffc58f 0%, #ff9949 52%, #e4641b 100%);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.42), 0 0 20px rgba(255, 138, 50, 0.28);
}

.arcade-button-secondary {
  border-color: #555b65;
  background: linear-gradient(180deg, #3c414a 0%, #23262c 100%);
}

.arcade-button-secondary:hover {
  border-color: rgba(255, 138, 50, 0.64);
  background: linear-gradient(180deg, #484e59 0%, #292d34 100%);
}

.arcade-button-ghost {
  border-color: rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.035);
  box-shadow: none;
}

.arcade-button-ghost:hover {
  border-color: rgba(255, 138, 50, 0.65);
  background: rgba(255, 138, 50, 0.08);
}

.arcade-button-small {
  min-height: 2.2rem;
  padding: 0.45rem 0.8rem;
  font-size: 0.68rem;
}

.arcade-button-medium {
  min-height: 2.75rem;
  padding: 0.66rem 1.15rem;
  font-size: clamp(0.72rem, 1.2vw, 0.88rem);
}

.arcade-button-large {
  min-height: clamp(3rem, 7vh, 4.25rem);
  padding: 0.85rem clamp(1.45rem, 4vw, 3.4rem);
  font-size: clamp(0.84rem, 1.7vw, 1.1rem);
}

.arcade-button-block {
  width: 100%;
}

.arcade-button-pulse {
  animation: arcade-pulse 2.2s ease-in-out infinite;
}

.arcade-button-disabled {
  opacity: 0.46;
  cursor: not-allowed;
  transform: none;
  animation: none;
}

.button-content {
  position: relative;
  z-index: 1;
}
</style>
