<template>
  <transition name="modal-fade">
    <div
      v-if="bazaarOpen"
      class="bazaar-overlay"
      role="presentation"
      @click.self="close"
    >
      <ArcadePanel
        ref="modal"
        class="bazaar-modal"
        :accent="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bazaar-title"
        tabindex="-1"
      >
        <button class="modal-close" type="button" aria-label="Close Quantum Bazaar" @click="close">×</button>

        <header class="bazaar-header">
          <div>
            <span class="bazaar-kicker">Temporal Commerce Terminal</span>
            <h2 id="bazaar-title">Quantum Bazaar</h2>
            <p>Buy ChronoGame cosmetics with your shared Jivaro Games Quanta.</p>
          </div>

          <div class="bazaar-wallet" :aria-label="`${walletLabel}: ${formattedBalance} Quanta`">
            <QuantaCoin size="medium" />
            <div>
              <span>{{ walletLabel }}</span>
              <strong>{{ formattedBalance }}</strong>
            </div>
          </div>
        </header>

        <ChronoBotMessage :message="storeMessage" :mood="catalogSource === 'server' ? 'neutral' : 'warning'" />

        <div class="bazaar-tabs" role="tablist" aria-label="Quantum Bazaar sections">
          <button
            v-for="tab in tabs"
            :id="`bazaar-tab-${tab.id}`"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`bazaar-panel-${tab.id}`"
            :class="['bazaar-tab', { active: activeTab === tab.id }]"
            @click="changeTab(tab.id)"
          >
            {{ tab.label }}
            <span v-if="tab.id === 'inventory'" class="tab-count">{{ ownedCount }}</span>
          </button>
        </div>

        <nav class="category-tabs" aria-label="Cosmetic categories">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :class="['category-tab', { active: category.id === activeCategory }]"
            :aria-pressed="category.id === activeCategory"
            @click="changeCategory(category.id)"
          >
            {{ category.label }}
          </button>
        </nav>

        <div
          :id="`bazaar-panel-${activeTab}`"
          class="bazaar-workspace"
          role="tabpanel"
          :aria-labelledby="`bazaar-tab-${activeTab}`"
        >
          <div class="catalog-column">
            <div v-if="visibleItems.length" class="store-grid internal-scroll">
              <CosmeticItemCard
                v-for="item in visibleItems"
                :key="item.itemKey"
                :item="item"
                :selected="selectedItem?.itemKey === item.itemKey"
                :owned="isOwned(item.itemKey)"
                :equipped="isEquipped(item)"
                @select="selectItem"
              />
            </div>

            <div v-else class="empty-catalog">
              <span aria-hidden="true">◇</span>
              <h3>No Items Here Yet</h3>
              <p>{{ emptyMessage }}</p>
            </div>
          </div>

          <CosmeticDetailPanel
            :item="selectedItem"
            :owned="selectedItem ? isOwned(selectedItem.itemKey) : false"
            :equipped="selectedItem ? isEquipped(selectedItem) : false"
            :guest="guest"
            :balance="balance"
            :catalog-available="catalogSource === 'server'"
            :purchase-status="purchaseStatus"
            :purchase-message="purchaseMessage"
            :equip-status="equipStatus"
            :live-message="liveMessage"
            @purchase="purchase"
            @equip="equip"
            @sign-in="openSignIn"
          />
        </div>

        <p v-if="error" class="bazaar-error" role="alert">{{ error }}</p>
        <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>

        <footer class="bazaar-footer">
          <span>{{ footerMessage }}</span>
          <button type="button" @click="close">Return to Cabinet</button>
        </footer>
      </ArcadePanel>
    </div>
  </transition>
</template>

<script>
import { nextTick } from 'vue'
import { mapGetters, mapState } from 'vuex'
import ArcadePanel from '../common/ArcadePanel.vue'
import ChronoBotMessage from '../common/ChronoBotMessage.vue'
import QuantaCoin from '../common/QuantaCoin.vue'
import CosmeticDetailPanel from './CosmeticDetailPanel.vue'
import CosmeticItemCard from './CosmeticItemCard.vue'
import { CHRONOBOT_MESSAGES } from '../../config/economy.js'

export default {
  name: 'QuantumBazaarModal',
  components: {
    ArcadePanel,
    ChronoBotMessage,
    CosmeticDetailPanel,
    CosmeticItemCard,
    QuantaCoin
  },
  data() {
    return {
      tabs: [
        { id: 'store', label: 'Store' },
        { id: 'inventory', label: 'Inventory' }
      ],
      previousFocus: null,
      suppressFocusRestore: false
    }
  },
  computed: {
    ...mapState('cosmetics', [
      'bazaarOpen',
      'activeTab',
      'activeCategory',
      'catalogSource',
      'purchaseStatus',
      'purchaseMessage',
      'equipStatus',
      'liveMessage',
      'error'
    ]),
    ...mapState('economy', ['balance', 'guest']),
    ...mapGetters('cosmetics', [
      'categories',
      'catalogItems',
      'inventoryItems',
      'selectedItem',
      'isOwned',
      'isEquipped'
    ]),
    ...mapGetters('economy', ['formattedBalance', 'walletLabel']),
    visibleItems() {
      const items = this.activeTab === 'inventory' ? this.inventoryItems : this.catalogItems
      return items.filter((item) => item.category === this.activeCategory)
    },
    ownedCount() {
      return Math.max(0, this.inventoryItems.length - 3)
    },
    storeMessage() {
      if (this.catalogSource !== 'server') {
        return 'Bazaar signal lost. Preview inventory is visible, but the Quanta terminal is locked.'
      }
      return this.guest
        ? `${CHRONOBOT_MESSAGES.store} ${CHRONOBOT_MESSAGES.guest}`
        : 'Catalog linked. ChronoBot is ready to process authenticated purchases.'
    },
    emptyMessage() {
      return this.activeTab === 'inventory'
        ? 'Purchase an item from the Store to add it to this category.'
        : 'The timeline has not delivered any active items for this category.'
    },
    footerMessage() {
      return this.guest
        ? 'Guests may preview cosmetics. Sign in to purchase or equip them.'
        : 'Prices and ownership are verified by the Jivaro Games ledger.'
    }
  },
  watch: {
    bazaarOpen(open) {
      if (open) {
        this.previousFocus = document.activeElement
        window.addEventListener('keydown', this.handleKeydown)
        nextTick(() => this.focusModal())
      } else {
        window.removeEventListener('keydown', this.handleKeydown)
        if (this.suppressFocusRestore) {
          this.suppressFocusRestore = false
        } else {
          nextTick(() => this.previousFocus?.focus?.())
        }
      }
    },
    visibleItems(items) {
      if (!items.some((item) => item.itemKey === this.selectedItem?.itemKey)) {
        this.$store.dispatch('cosmetics/selectItem', items[0]?.itemKey || '')
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    close() {
      this.$store.dispatch('cosmetics/closeBazaar')
    },
    changeTab(tab) {
      this.$store.dispatch('cosmetics/changeTab', tab)
    },
    changeCategory(category) {
      this.$store.dispatch('cosmetics/changeCategory', category)
    },
    selectItem(itemKey) {
      this.$store.dispatch('cosmetics/selectItem', itemKey)
    },
    purchase(itemKey) {
      this.$store.dispatch('cosmetics/purchaseItem', itemKey)
    },
    equip(item) {
      this.$store.dispatch('cosmetics/equipItem', item)
    },
    async openSignIn() {
      this.suppressFocusRestore = true
      await this.$store.dispatch('cosmetics/closeBazaar')
      this.$store.commit('online/setAuthModalOpen', true)
    },
    focusModal() {
      const element = this.$refs.modal?.$el || this.$refs.modal
      const firstFocusable = element?.querySelector?.('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ;(firstFocusable || element)?.focus?.()
    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.close()
        return
      }

      if (event.key !== 'Tab') return

      const element = this.$refs.modal?.$el || this.$refs.modal
      const focusable = [...(element?.querySelectorAll?.('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
        .filter((node) => node.offsetParent !== null)

      if (!focusable.length) {
        event.preventDefault()
        element?.focus?.()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
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
  padding: clamp(0.45rem, 2vw, 1.4rem);
  background: rgba(3, 4, 6, 0.9);
  backdrop-filter: blur(10px);
}

.bazaar-modal {
  width: min(76rem, 100%);
  max-height: min(95dvh, 58rem);
  display: grid;
  grid-template-rows: auto auto auto auto minmax(0, 1fr) auto auto;
  gap: clamp(0.45rem, 1vh, 0.78rem);
  padding: clamp(0.75rem, 1.8vw, 1.35rem);
  overflow: hidden;
}

.modal-close {
  position: absolute;
  z-index: 4;
  top: 0.65rem;
  right: 0.7rem;
  width: 2.45rem;
  height: 2.45rem;
  color: var(--color-text);
  font-size: 1.7rem;
  line-height: 1;
  border: 1px solid var(--color-border-soft);
  background: var(--color-panel-deep);
  cursor: pointer;
}

.modal-close:hover {
  color: var(--color-accent-bright);
  border-color: var(--color-border-accent);
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
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.bazaar-header h2 {
  margin: 0.18rem 0 0.25rem;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 4vw, 2.65rem);
}

.bazaar-header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: clamp(0.72rem, 1vw, 0.86rem);
}

.bazaar-wallet {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid rgba(255, 190, 72, 0.38);
  background: rgba(7, 8, 10, 0.72);
  box-shadow: 0 0 18px rgba(255, 190, 72, 0.12);
}

.bazaar-wallet span,
.bazaar-wallet strong {
  display: block;
}

.bazaar-wallet span {
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bazaar-wallet strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 1.08rem;
}

.bazaar-tabs,
.category-tabs {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.bazaar-tab,
.category-tab {
  flex: 0 0 auto;
  min-height: 2.25rem;
  padding: 0.45rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border: 1px solid var(--color-border-soft);
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
}

.bazaar-tab.active,
.category-tab.active {
  color: var(--color-button-primary-text);
  border-color: var(--color-accent-bright);
  background: var(--gradient-button-primary);
  box-shadow: 0 0 14px var(--color-accent-glow);
}

.bazaar-tab {
  min-width: 8rem;
}

.tab-count {
  display: inline-grid;
  min-width: 1.2rem;
  min-height: 1.2rem;
  place-items: center;
  margin-left: 0.35rem;
  padding: 0 0.2rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.3);
}

.bazaar-workspace {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(16rem, 0.85fr);
  gap: 0.75rem;
}

.catalog-column {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.store-grid {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: start;
  gap: 0.65rem;
  padding: 0.1rem 0.25rem 0.4rem 0.1rem;
  overflow-y: auto;
}

.empty-catalog {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  padding: 1rem;
  color: var(--color-text-muted);
  text-align: center;
  border: 1px dashed var(--color-border-soft);
}

.empty-catalog span {
  color: var(--color-accent-bright);
  font-size: 2.6rem;
}

.empty-catalog h3 {
  margin: 0.3rem 0;
  font-family: var(--font-display);
  font-size: 0.9rem;
}

.empty-catalog p {
  max-width: 22rem;
  margin: 0;
  font-size: 0.74rem;
}

.bazaar-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.7rem;
  text-align: center;
}

.bazaar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.bazaar-footer button {
  min-height: 2.1rem;
  padding: 0.4rem 0.65rem;
  color: var(--color-text);
  font-weight: 800;
  border: 1px solid var(--color-border-soft);
  background: var(--color-panel-soft);
  cursor: pointer;
}

@media (max-width: 980px) {
  .store-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .bazaar-modal {
    grid-template-rows: auto auto auto auto minmax(0, 1fr) auto auto;
  }

  .bazaar-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .bazaar-wallet {
    align-self: stretch;
    justify-content: center;
  }

  .bazaar-workspace {
    grid-template-columns: 1fr;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .catalog-column {
    min-height: 16rem;
    overflow: visible;
  }

  .store-grid {
    height: auto;
    max-height: 22rem;
  }
}

@media (max-width: 520px) {
  .store-grid {
    grid-template-columns: 1fr;
  }

  .bazaar-footer {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }
}

@media (max-height: 650px) and (min-width: 761px) {
  .bazaar-modal {
    gap: 0.35rem;
    padding: 0.6rem;
  }

  .bazaar-header p,
  .bazaar-modal :deep(.chronobot-message) {
    display: none;
  }
}
</style>
