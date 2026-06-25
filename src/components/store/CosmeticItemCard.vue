<template>
  <button
    type="button"
    :class="['cosmetic-card', { selected, owned, equipped }]"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    @click="$emit('select', item.itemKey)"
  >
    <span class="card-preview" aria-hidden="true">
      <span v-if="item.category === 'pet' && item.imageUrl" class="card-pet-sprite" :style="spriteStyle"></span>
      <img v-else-if="item.previewUrl" :src="item.previewUrl" :alt="''" loading="lazy" />
      <span v-else class="default-preview">{{ defaultGlyph }}</span>
      <span v-if="equipped" class="status-badge equipped-badge">Equipped</span>
      <span v-else-if="owned && !item.isDefault" class="status-badge owned-badge">Owned</span>
      <span v-else-if="item.isDefault" class="status-badge default-badge">Default</span>
    </span>

    <span class="card-copy">
      <small>{{ categoryLabel }}</small>
      <strong>{{ item.displayName }}</strong>
    </span>

    <span class="card-price">
      <template v-if="item.isDefault">Free</template>
      <template v-else-if="owned">In Inventory</template>
      <template v-else>
        <QuantaCoin />
        {{ item.price.toLocaleString() }}
      </template>
    </span>
  </button>
</template>

<script>
import QuantaCoin from '../common/QuantaCoin.vue'

export default {
  name: 'CosmeticItemCard',
  components: {
    QuantaCoin
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    owned: {
      type: Boolean,
      default: false
    },
    equipped: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  computed: {
    categoryLabel() {
      const labels = {
        background: 'Background',
        ui_skin: 'UI Skin',
        pet: 'Pet'
      }
      return labels[this.item.category] || 'Cosmetic'
    },
    defaultGlyph() {
      if (this.item.category === 'pet') return '×'
      if (this.item.category === 'ui_skin') return '▦'
      return '⌁'
    },
    spriteStyle() {
      return this.item.imageUrl
        ? { backgroundImage: `url("${this.item.imageUrl}")` }
        : {}
    },
    ariaLabel() {
      const status = this.equipped ? 'Equipped.' : this.owned ? 'Owned.' : `${this.item.price} Quanta.`
      return `${this.item.displayName}. ${status}`
    }
  }
}
</script>

<style scoped>
.cosmetic-card {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 0.45rem;
  padding: 0.55rem;
  color: var(--color-text);
  text-align: left;
  border: 1px solid var(--color-border-soft);
  clip-path: polygon(0.45rem 0, 100% 0, 100% calc(100% - 0.45rem), calc(100% - 0.45rem) 100%, 0 100%, 0 0.45rem);
  background: linear-gradient(145deg, var(--color-store-surface), var(--color-panel-deep));
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.cosmetic-card:hover,
.cosmetic-card.selected {
  border-color: var(--color-border-accent);
  transform: translateY(-2px);
  box-shadow: 0 0 18px var(--color-accent-glow);
}

.cosmetic-card.selected {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: -4px;
}

.card-preview {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  background:
    repeating-linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.08) 0 0.5rem, transparent 0.5rem 1rem),
    #080a0e;
}

.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.card-pet-sprite {
  width: 4.35rem;
  height: 4.35rem;
  display: block;
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: 400% 100%;
  image-rendering: pixelated;
  animation: pet-sprite-cycle 1.25s linear infinite;
}

.default-preview {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 2rem;
  text-shadow: 0 0 16px var(--color-accent-glow);
}

.status-badge {
  position: absolute;
  left: 0.35rem;
  bottom: 0.35rem;
  padding: 0.2rem 0.35rem;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  background: rgba(4, 5, 8, 0.9);
}

.equipped-badge {
  color: var(--color-success-soft);
}

.owned-badge,
.default-badge {
  color: var(--color-quanta-highlight);
}

.card-copy {
  min-width: 0;
}

.card-copy small,
.card-copy strong {
  display: block;
}

.card-copy small {
  color: var(--color-accent-bright);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.card-copy strong {
  margin-top: 0.14rem;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price {
  min-height: 1.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
}

@media (prefers-reduced-motion: reduce) {
  .card-pet-sprite {
    animation: none !important;
  }
}
</style>
