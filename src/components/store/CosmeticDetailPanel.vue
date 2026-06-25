<template>
  <section v-if="item" class="cosmetic-detail" aria-labelledby="cosmetic-detail-title">
    <div class="detail-preview" aria-hidden="true">
      <span v-if="item.category === 'pet' && item.imageUrl" class="detail-pet-sprite" :style="spriteStyle"></span>
      <img v-else-if="item.previewUrl" :src="item.previewUrl" :alt="''" />
      <span v-else class="detail-default-glyph">{{ defaultGlyph }}</span>
    </div>

    <div class="detail-copy">
      <span class="detail-category">{{ categoryLabel }}</span>
      <h3 id="cosmetic-detail-title">{{ item.displayName }}</h3>
      <p>{{ item.description }}</p>
    </div>

    <dl class="detail-stats">
      <div>
        <dt>Status</dt>
        <dd>{{ statusLabel }}</dd>
      </div>
      <div>
        <dt>Price</dt>
        <dd>{{ item.isDefault ? 'Free' : `${item.price.toLocaleString()} Q` }}</dd>
      </div>
    </dl>

    <div v-if="confirming" class="purchase-confirmation">
      <strong>Confirm Purchase</strong>
      <p>{{ item.displayName }} will cost {{ item.price.toLocaleString() }} Quanta.</p>
      <dl>
        <div>
          <dt>Current</dt>
          <dd>{{ balance.toLocaleString() }} Q</dd>
        </div>
        <div>
          <dt>After</dt>
          <dd>{{ remainingBalance.toLocaleString() }} Q</dd>
        </div>
      </dl>
      <div class="confirmation-actions">
        <ArcadeButton size="small" variant="secondary" @click="confirming = false">Cancel</ArcadeButton>
        <ArcadeButton size="small" :disabled="purchasing" @click="confirmPurchase">
          {{ purchasing ? 'Processing…' : 'Confirm' }}
        </ArcadeButton>
      </div>
    </div>

    <div v-else class="detail-actions">
      <ArcadeButton
        v-if="showSignIn"
        size="small"
        :block="true"
        @click="$emit('sign-in')"
      >
        Sign In to Buy
      </ArcadeButton>

      <ArcadeButton
        v-else-if="showPreviewOnly"
        size="small"
        variant="ghost"
        :block="true"
        :disabled="true"
      >
        Preview Only
      </ArcadeButton>

      <ArcadeButton
        v-else-if="showPurchase"
        size="small"
        :block="true"
        :disabled="!catalogAvailable || insufficientFunds || purchasing"
        @click="startPurchase"
      >
        {{ purchaseButtonLabel }}
      </ArcadeButton>

      <ArcadeButton
        v-if="showEquip"
        size="small"
        variant="secondary"
        :block="true"
        :disabled="equipping"
        @click="$emit('equip', item)"
      >
        {{ equipping ? 'Equipping…' : equipButtonLabel }}
      </ArcadeButton>

      <ArcadeButton
        v-else-if="equipped"
        size="small"
        variant="ghost"
        :block="true"
        :disabled="true"
      >
        Equipped
      </ArcadeButton>
    </div>

    <p
      v-if="actionMessage"
      :class="['detail-message', `message-${messageTone}`]"
      role="status"
      aria-live="polite"
    >
      {{ actionMessage }}
    </p>
  </section>

  <section v-else class="cosmetic-detail empty-detail">
    <span aria-hidden="true">◇</span>
    <p>Select an item to inspect it.</p>
  </section>
</template>

<script>
import ArcadeButton from '../common/ArcadeButton.vue'

export default {
  name: 'CosmeticDetailPanel',
  components: {
    ArcadeButton
  },
  props: {
    item: {
      type: Object,
      default: null
    },
    owned: {
      type: Boolean,
      default: false
    },
    equipped: {
      type: Boolean,
      default: false
    },
    guest: {
      type: Boolean,
      default: true
    },
    balance: {
      type: Number,
      default: 0
    },
    catalogAvailable: {
      type: Boolean,
      default: false
    },
    purchaseStatus: {
      type: String,
      default: 'idle'
    },
    purchaseMessage: {
      type: String,
      default: ''
    },
    equipStatus: {
      type: String,
      default: 'idle'
    },
    liveMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['purchase', 'equip', 'sign-in'],
  data() {
    return {
      confirming: false
    }
  },
  computed: {
    categoryLabel() {
      const labels = {
        background: 'Background',
        ui_skin: 'UI Skin',
        pet: 'Pet'
      }
      return labels[this.item?.category] || 'Cosmetic'
    },
    defaultGlyph() {
      if (this.item?.category === 'pet') return '×'
      if (this.item?.category === 'ui_skin') return '▦'
      return '⌁'
    },
    spriteStyle() {
      return this.item?.imageUrl
        ? { backgroundImage: `url("${this.item.imageUrl}")` }
        : {}
    },
    statusLabel() {
      if (this.equipped) return 'Equipped'
      if (this.owned) return 'Owned'
      if (this.item?.isDefault) return 'Available'
      return 'Not Owned'
    },
    remainingBalance() {
      return Math.max(0, this.balance - Number(this.item?.price || 0))
    },
    insufficientFunds() {
      return !this.item?.isDefault && this.balance < Number(this.item?.price || 0)
    },
    purchasing() {
      return this.purchaseStatus === 'purchasing'
    },
    equipping() {
      return this.equipStatus === 'equipping'
    },
    showSignIn() {
      return this.guest && this.catalogAvailable && !this.owned && !this.item?.isDefault
    },
    showPurchase() {
      return !this.guest && !this.owned && !this.item?.isDefault
    },
    showPreviewOnly() {
      return this.guest && !this.catalogAvailable && !this.owned && !this.item?.isDefault
    },
    showEquip() {
      return this.owned && !this.equipped
    },
    purchaseButtonLabel() {
      if (!this.catalogAvailable) return 'Preview Only'
      if (this.insufficientFunds) return 'Insufficient Quanta'
      if (this.purchasing) return 'Processing…'
      return `Purchase · ${this.item.price.toLocaleString()} Q`
    },
    equipButtonLabel() {
      return this.item?.isDefault ? 'Restore Default' : 'Equip'
    },
    actionMessage() {
      if (!this.catalogAvailable && !this.item?.isDefault) {
        return 'The live catalog is unavailable. This item can be previewed but not purchased.'
      }
      if (this.insufficientFunds && this.showPurchase) {
        return `You need ${(this.item.price - this.balance).toLocaleString()} more Quanta.`
      }
      return this.purchaseMessage || this.liveMessage
    },
    messageTone() {
      if (['error', 'insufficient', 'unavailable'].includes(this.purchaseStatus) || this.equipStatus === 'error') {
        return 'error'
      }
      if (['purchased', 'owned'].includes(this.purchaseStatus) || this.equipStatus === 'equipped') {
        return 'success'
      }
      return 'neutral'
    }
  },
  watch: {
    item() {
      this.confirming = false
    },
    purchaseStatus(status) {
      if (status !== 'purchasing') this.confirming = false
    }
  },
  methods: {
    startPurchase() {
      if (!this.catalogAvailable || this.insufficientFunds || this.purchasing) return
      this.confirming = true
    },
    confirmPurchase() {
      this.$emit('purchase', this.item.itemKey)
    }
  }
}
</script>

<style scoped>
.cosmetic-detail {
  min-width: 0;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 0.65rem;
  padding: 0.75rem;
  overflow-y: auto;
  border: 1px solid var(--color-border-accent);
  clip-path: polygon(0.65rem 0, 100% 0, 100% calc(100% - 0.65rem), calc(100% - 0.65rem) 100%, 0 100%, 0 0.65rem);
  background: linear-gradient(145deg, var(--color-panel), var(--color-panel-deep));
  box-shadow: inset 0 0 0 3px rgba(var(--color-accent-rgb), 0.05);
  scrollbar-width: thin;
}

.detail-preview {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-border-accent);
  background:
    radial-gradient(circle at 50% 110%, rgba(var(--color-accent-rgb), 0.18), transparent 55%),
    #07090d;
}

.detail-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.detail-pet-sprite {
  width: 7.5rem;
  height: 7.5rem;
  display: block;
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: 400% 100%;
  image-rendering: pixelated;
  animation: pet-sprite-cycle 1.25s linear infinite;
  filter: drop-shadow(0 0.5rem 0.35rem rgba(0, 0, 0, 0.58));
}

.detail-default-glyph {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: 3.4rem;
  text-shadow: 0 0 22px var(--color-accent-glow);
}

.detail-category {
  color: var(--color-accent-bright);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-copy h3 {
  margin: 0.2rem 0 0.35rem;
  font-family: var(--font-display);
  font-size: clamp(1rem, 2.2vw, 1.45rem);
}

.detail-copy p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.48;
}

.detail-stats,
.purchase-confirmation dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin: 0;
}

.detail-stats > div,
.purchase-confirmation dl > div {
  padding: 0.45rem;
  border: 1px solid var(--color-border-soft);
  background: rgba(0, 0, 0, 0.22);
}

.detail-stats dt,
.purchase-confirmation dt {
  color: var(--color-text-muted);
  font-size: 0.63rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-stats dd,
.purchase-confirmation dd {
  margin: 0.12rem 0 0;
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.75rem;
}

.detail-actions,
.confirmation-actions {
  display: grid;
  gap: 0.45rem;
}

.purchase-confirmation {
  display: grid;
  gap: 0.55rem;
  padding: 0.65rem;
  border: 1px solid var(--color-quanta);
  background: rgba(0, 0, 0, 0.3);
}

.purchase-confirmation strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.82rem;
}

.purchase-confirmation p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.4;
}

.confirmation-actions {
  grid-template-columns: 1fr 1fr;
}

.detail-message {
  margin: 0;
  padding: 0.5rem;
  font-size: 0.7rem;
  line-height: 1.4;
  border-left: 3px solid var(--color-border);
  background: rgba(0, 0, 0, 0.22);
}

.message-error {
  color: var(--color-danger);
  border-left-color: var(--color-danger);
}

.message-success {
  color: var(--color-success-soft);
  border-left-color: var(--color-success);
}

.message-neutral {
  color: var(--color-text-muted);
}

.empty-detail {
  place-content: center;
  justify-items: center;
  color: var(--color-text-muted);
  text-align: center;
}

.empty-detail span {
  color: var(--color-accent-bright);
  font-size: 2.5rem;
}

.empty-detail p {
  margin: 0;
  font-size: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .detail-pet-sprite {
    animation: none !important;
  }
}
</style>
