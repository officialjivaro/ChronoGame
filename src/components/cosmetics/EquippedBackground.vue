<template>
  <div
    :class="['equipped-background', { 'has-background': Boolean(item), 'gameplay-dim': gameplay }]"
    aria-hidden="true"
  >
    <transition name="cosmetic-background-fade" mode="out-in">
      <div
        v-if="item"
        :key="item.itemKey"
        class="equipped-background-image"
        :style="backgroundStyle"
      ></div>
    </transition>
    <div class="equipped-background-shade"></div>
  </div>
</template>

<script>
export default {
  name: 'EquippedBackground',
  props: {
    item: {
      type: Object,
      default: null
    },
    gameplay: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    backgroundStyle() {
      return this.item?.imageUrl
        ? { backgroundImage: `url("${this.item.imageUrl}")` }
        : {}
    }
  }
}
</script>

<style scoped>
.equipped-background {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.equipped-background-image,
.equipped-background-shade {
  position: absolute;
  inset: 0;
}

.equipped-background-image {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  image-rendering: pixelated;
  filter: saturate(0.92) brightness(0.68);
  transform: scale(1.01);
}

.equipped-background-shade {
  background:
    radial-gradient(circle at 50% 45%, rgba(8, 10, 14, 0.26), rgba(5, 6, 9, 0.76) 78%),
    linear-gradient(180deg, rgba(4, 5, 8, 0.36), rgba(4, 5, 8, 0.66));
  transition: background var(--transition-medium);
}

.gameplay-dim .equipped-background-image {
  filter: saturate(0.7) brightness(0.4);
}

.gameplay-dim .equipped-background-shade {
  background:
    radial-gradient(ellipse at 50% 48%, rgba(4, 5, 8, 0.82) 0 34%, rgba(4, 5, 8, 0.72) 54%, rgba(4, 5, 8, 0.86) 100%),
    linear-gradient(180deg, rgba(4, 5, 8, 0.62), rgba(4, 5, 8, 0.82));
}

.cosmetic-background-fade-enter-active,
.cosmetic-background-fade-leave-active {
  transition: opacity 420ms ease;
}

.cosmetic-background-fade-enter-from,
.cosmetic-background-fade-leave-to {
  opacity: 0;
}
</style>
