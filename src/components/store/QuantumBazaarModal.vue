<template>
  <transition name="modal-fade">
    <div
      v-if="storeOpen"
      class="bazaar-overlay"
      role="presentation"
      @click.self="close"
    >
      <ArcadePanel
        class="bazaar-modal"
        :accent="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bazaar-title"
      >
        <button class="modal-close" type="button" aria-label="Close Quantum Bazaar" @click="close">×</button>

        <header class="bazaar-header">
          <div>
            <span class="bazaar-kicker">Temporal Commerce Preview</span>
            <h2 id="bazaar-title">Quantum Bazaar</h2>
            <p>Browse future cosmetics. Purchases are not active yet.</p>
          </div>

          <div class="bazaar-wallet" :aria-label="`${walletLabel}: ${formattedBalance} Quanta`">
            <QuantaCoin size="medium" />
            <div>
              <span>{{ walletLabel }}</span>
              <strong>{{ formattedBalance }}</strong>
            </div>
          </div>
        </header>

        <ChronoBotMessage :message="storeMessage" mood="neutral" />

        <nav class="category-tabs" aria-label="Quantum Bazaar categories">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :class="['category-tab', { active: category.id === activeCategory }]"
            :aria-pressed="category.id === activeCategory"
            @click="activeCategory = category.id"
          >
            {{ category.label }}
          </button>
        </nav>

        <div class="store-grid" tabindex="0" aria-label="Coming soon store items">
          <article v-for="item in filteredItems" :key="item.id" class="store-item">
            <div class="item-preview" aria-hidden="true">
              <span>{{ item.name.slice(0, 1) }}</span>
            </div>
            <div class="item-copy">
              <small>{{ categoryLabel(item.category) }}</small>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
            <div class="item-footer">
              <span class="preview-price" title="Preview price — store not yet active">
                <QuantaCoin />
                {{ item.price }}
              </span>
              <button type="button" disabled>Coming Soon</button>
            </div>
          </article>
        </div>

        <footer class="bazaar-footer">
          <span>Preview prices may change before the store opens.</span>
          <button type="button" @click="close">Return to the Cabinet</button>
        </footer>
      </ArcadePanel>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ArcadePanel from '../common/ArcadePanel.vue'
import ChronoBotMessage from '../common/ChronoBotMessage.vue'
import QuantaCoin from '../common/QuantaCoin.vue'
import {
  CHRONOBOT_MESSAGES,
  STORE_CATEGORIES,
  STORE_ITEMS
} from '../../config/economy.js'

export default {
  name: 'QuantumBazaarModal',
  components: {
    ArcadePanel,
    ChronoBotMessage,
    QuantaCoin
  },
  data() {
    return {
      activeCategory: STORE_CATEGORIES[0]?.id || 'cabinet',
      categories: STORE_CATEGORIES,
      items: STORE_ITEMS
    }
  },
  computed: {
    ...mapState('economy', ['storeOpen', 'guest']),
    ...mapGetters('economy', ['formattedBalance', 'walletLabel']),
    filteredItems() {
      return this.items.filter((item) => item.category === this.activeCategory)
    },
    storeMessage() {
      return this.guest
        ? `${CHRONOBOT_MESSAGES.store} ${CHRONOBOT_MESSAGES.guest}`
        : `${CHRONOBOT_MESSAGES.store} ${CHRONOBOT_MESSAGES.signedIn}`
    }
  },
  watch: {
    storeOpen(open) {
      if (open) {
        window.addEventListener('keydown', this.handleKeydown)
      } else {
        window.removeEventListener('keydown', this.handleKeydown)
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    categoryLabel(categoryId) {
      return this.categories.find((category) => category.id === categoryId)?.label || 'Preview Item'
    },
    close() {
      this.$store.dispatch('economy/closeStore')
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close()
    }
  }
}
</script>

<style scoped>
.bazaar-overlay {
  position: fixed;
  z-index: calc(var(--z-modal) + 30);
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.45rem, 2vw, 1.5rem);
  background: rgba(3, 4, 6, 0.86);
  backdrop-filter: blur(9px);
}

.bazaar-modal {
  width: min(72rem, 100%);
  max-height: min(94dvh, 56rem);
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  gap: clamp(0.5rem, 1.2vh, 0.9rem);
  padding: clamp(0.75rem, 2vw, 1.4rem);
  overflow: hidden;
}

.modal-close {
  position: absolute;
  z-index: 4;
  top: 0.65rem;
  right: 0.7rem;
  width: 2.35rem;
  height: 2.35rem;
  color: var(--color-text);
  font-size: 1.65rem;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-small);
  background: #20232a;
  cursor: pointer;
}

.bazaar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-right: 3rem;
}

.bazaar-kicker {
  color: var(--color-quanta);
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.bazaar-header h2 {
  margin: 0.18rem 0 0.25rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 4vw, 2.5rem);
}

.bazaar-header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: clamp(0.65rem, 1vw, 0.82rem);
}

.bazaar-wallet {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(255, 190, 72, 0.34);
  border-radius: var(--radius-medium);
  background: rgba(7, 8, 10, 0.58);
  box-shadow: 0 0 18px rgba(255, 190, 72, 0.1);
}

.bazaar-wallet span,
.bazaar-wallet strong {
  display: block;
}

.bazaar-wallet span {
  color: var(--color-text-muted);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bazaar-wallet strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.category-tabs {
  display: flex;
  gap: 0.35rem;
  padding-bottom: 0.15rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.category-tab {
  flex: 0 0 auto;
  min-height: 2.15rem;
  padding: 0.4rem 0.65rem;
  color: var(--color-text-muted);
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-small);
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
}

.category-tab.active {
  color: #2c1b03;
  border-color: var(--color-quanta-highlight);
  background: linear-gradient(180deg, var(--color-quanta-highlight), var(--color-quanta));
  box-shadow: 0 0 14px rgba(255, 190, 72, 0.22);
}

.store-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 0.15rem 0.15rem 0.4rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-quanta-shadow) #121419;
}

.store-item {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.55rem;
  padding: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-medium);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 45%),
    var(--color-store-surface);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.store-item:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 190, 72, 0.38);
}

.item-preview {
  display: grid;
  aspect-ratio: 16 / 7;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 190, 72, 0.24);
  border-radius: var(--radius-small);
  background:
    radial-gradient(circle at 50% 120%, rgba(255, 190, 72, 0.35), transparent 55%),
    repeating-linear-gradient(135deg, #252931 0 0.5rem, #171a20 0.5rem 1rem);
}

.item-preview span {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 4vw, 2.4rem);
  text-shadow: 0 0 16px rgba(255, 190, 72, 0.38);
}

.item-copy small {
  color: var(--color-quanta);
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.item-copy h3 {
  margin: 0.18rem 0 0.28rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(0.68rem, 1.2vw, 0.9rem);
}

.item-copy p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.6rem;
  line-height: 1.4;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}

.preview-price {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.72rem;
}

.item-footer button,
.bazaar-footer button {
  min-height: 2rem;
  padding: 0.35rem 0.55rem;
  color: var(--color-text-muted);
  font-size: 0.54rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-small);
  background: #1e2127;
}

.item-footer button {
  opacity: 0.62;
  cursor: not-allowed;
}

.bazaar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: var(--color-text-muted);
  font-size: 0.58rem;
}

.bazaar-footer button {
  color: var(--color-text);
  cursor: pointer;
}

@media (max-width: 900px) {
  .store-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .bazaar-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .bazaar-wallet {
    align-self: stretch;
    justify-content: center;
  }

  .store-grid {
    grid-template-columns: 1fr;
  }

  .bazaar-footer {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }
}

@media (max-height: 620px) and (min-width: 720px) {
  .store-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .item-copy p {
    display: none;
  }
}
</style>
