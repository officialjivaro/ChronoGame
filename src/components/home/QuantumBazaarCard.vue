<template>
  <section class="bazaar-preview" aria-labelledby="bazaar-preview-title">
    <div class="preview-heading">
      <QuantaCoin size="medium" />
      <div>
        <span>{{ walletLabel }}</span>
        <strong>{{ formattedBalance }} Quanta</strong>
      </div>
      <span class="bazaar-live">Open</span>
    </div>

    <div class="preview-copy">
      <h2 id="bazaar-preview-title">Quantum Bazaar</h2>
      <p>Retro backgrounds, UI skins, and temporal pets for your ChronoGame cabinet.</p>
    </div>

    <ChronoBotMessage :message="message" :compact="true" />

    <ArcadeButton variant="ghost" size="small" :block="true" @click="$emit('open-store')">
      Open Bazaar
    </ArcadeButton>
  </section>
</template>

<script>
import ArcadeButton from '../common/ArcadeButton.vue'
import ChronoBotMessage from '../common/ChronoBotMessage.vue'
import QuantaCoin from '../common/QuantaCoin.vue'
import { CHRONOBOT_MESSAGES } from '../../config/economy.js'

export default {
  name: 'QuantumBazaarCard',
  components: {
    ArcadeButton,
    ChronoBotMessage,
    QuantaCoin
  },
  props: {
    balance: {
      type: Number,
      default: 0
    },
    walletLabel: {
      type: String,
      default: 'Guest Quanta'
    },
    guest: {
      type: Boolean,
      default: true
    }
  },
  emits: ['open-store'],
  computed: {
    formattedBalance() {
      return Number(this.balance || 0).toLocaleString()
    },
    message() {
      return this.guest
        ? 'Preview every cosmetic now. Sign in when you are ready to buy.'
        : CHRONOBOT_MESSAGES.store
    }
  }
}
</script>

<style scoped>
.bazaar-preview {
  min-width: 0;
  display: grid;
  gap: 0.48rem;
  padding: 0.6rem;
  border: 1px solid rgba(255, 190, 72, 0.3);
  clip-path: polygon(0.45rem 0, 100% 0, 100% calc(100% - 0.45rem), calc(100% - 0.45rem) 100%, 0 100%, 0 0.45rem);
  background:
    radial-gradient(circle at 10% 0%, rgba(255, 190, 72, 0.12), transparent 42%),
    rgba(0, 0, 0, 0.24);
  box-shadow: 0 0 16px rgba(255, 190, 72, 0.07);
}

.preview-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
}

.preview-heading span,
.preview-heading strong {
  display: block;
}

.preview-heading > div span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-heading strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.75rem;
}

.bazaar-live {
  padding: 0.28rem 0.42rem;
  color: #102014;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border: 1px solid var(--color-success-soft);
  background: var(--color-success);
}

.preview-copy h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.82rem;
}

.preview-copy p {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  line-height: 1.4;
}

@media (max-height: 680px) {
  .preview-copy p,
  .chronobot-message {
    display: none;
  }
}
</style>
