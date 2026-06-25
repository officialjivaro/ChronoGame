<template>
  <transition name="pet-dock-fade">
    <aside v-if="visible && pet" class="pet-dock" :aria-label="`${pet.displayName}, equipped pet`">
      <span class="pet-dock-label">Active Pet</span>
      <span class="pet-bob" aria-hidden="true">
        <span class="pet-sprite" :style="spriteStyle"></span>
      </span>
      <strong>{{ pet.displayName }}</strong>
    </aside>
  </transition>
</template>

<script>
export default {
  name: 'EquippedPetDock',
  props: {
    pet: {
      type: Object,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    spriteStyle() {
      return this.pet?.imageUrl
        ? { backgroundImage: `url("${this.pet.imageUrl}")` }
        : {}
    }
  }
}
</script>

<style scoped>
.pet-dock {
  position: fixed;
  z-index: 12;
  right: clamp(0.55rem, 1.8vw, 1.4rem);
  bottom: clamp(0.55rem, 1.8vh, 1.15rem);
  width: 7.1rem;
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.5rem 0.5rem;
  pointer-events: none;
  border: 1px solid var(--color-border-accent);
  clip-path: polygon(0.55rem 0, 100% 0, 100% calc(100% - 0.55rem), calc(100% - 0.55rem) 100%, 0 100%, 0 0.55rem);
  background: linear-gradient(145deg, var(--color-panel), var(--color-panel-deep));
  box-shadow: var(--shadow-panel), var(--shadow-accent);
}

.pet-dock-label {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.pet-bob {
  width: 4.75rem;
  height: 4.75rem;
  display: grid;
  place-items: center;
  animation: pet-dock-bob 2.8s ease-in-out infinite;
}

.pet-sprite {
  width: 4rem;
  height: 4rem;
  display: block;
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: 400% 100%;
  image-rendering: pixelated;
  animation: pet-sprite-cycle 1.25s linear infinite;
  filter: drop-shadow(0 0.35rem 0.25rem rgba(0, 0, 0, 0.55));
}

.pet-dock strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 0.66rem;
  text-align: center;
}

.pet-dock-fade-enter-active,
.pet-dock-fade-leave-active {
  transition: opacity var(--transition-medium), transform var(--transition-medium);
}

.pet-dock-fade-enter-from,
.pet-dock-fade-leave-to {
  opacity: 0;
  transform: translateY(0.8rem);
}

@media (max-width: 900px), (max-height: 620px) {
  .pet-dock {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pet-bob,
  .pet-sprite {
    animation: none !important;
  }
}
</style>
