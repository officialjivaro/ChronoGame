<template>
  <component
    :is="tag"
    :class="[
      'arcade-panel',
      {
        'arcade-panel-accent': accent,
        'arcade-panel-flush': flush
      }
    ]"
  >
    <slot></slot>
  </component>
</template>

<script>
export default {
  name: 'ArcadePanel',
  props: {
    tag: {
      type: String,
      default: 'div'
    },
    accent: {
      type: Boolean,
      default: false
    },
    flush: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.arcade-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 32%),
    linear-gradient(145deg, var(--color-panel) 0%, var(--color-panel-deep) 100%);
  box-shadow: var(--shadow-panel);
}

.arcade-panel::before {
  content: '';
  position: absolute;
  inset: 3px;
  pointer-events: none;
  border: 1px solid var(--color-border-soft);
  border-radius: calc(var(--radius-large) - 3px);
}

.arcade-panel-accent {
  border-color: rgba(255, 138, 50, 0.52);
  box-shadow: var(--shadow-panel), var(--shadow-accent);
}

.arcade-panel-flush {
  padding: 0;
  overflow: hidden;
}
</style>
