<template>
  <section class="bazaar-preview" aria-labelledby="bazaar-preview-title">
    <div class="preview-heading">
      <QuantaCoin size="medium" />
      <div>
        <span>{{ walletLabel }}</span>
        <strong>{{ formattedBalance }} Quanta</strong>
      </div>
      <span class="coming-soon">Coming Soon</span>
    </div>

    <div class="preview-copy">
      <h2 id="bazaar-preview-title">Quantum Bazaar</h2>
      <p>Future cabinet skins, frames, effects, badges, and ChronoBot accessories.</p>
    </div>

    <ChronoBotMessage :message="message" :compact="true" />

    <ArcadeButton variant="ghost" size="small" :block="true" @click="$emit('open-store')">
      Browse Preview
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
      return this.guest ? CHRONOBOT_MESSAGES.guest : CHRONOBOT_MESSAGES.signedIn
    }
  }
}
</script>

<style scoped>
.bazaar-preview {
  min-width: 0;
  display: grid;
  gap: 0.45rem;
  padding: 0.55rem;
  border: 1px solid rgba(255, 190, 72, 0.26);
  border-radius: var(--radius-small);
  background:
    radial-gradient(circle at 10% 0%, rgba(255, 190, 72, 0.12), transparent 42%),
    rgba(0, 0, 0, 0.22);
  box-shadow: 0 0 16px rgba(255, 190, 72, 0.06);
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
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-heading strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.7rem;
}

.coming-soon {
  padding: 0.28rem 0.4rem;
  color: #2d1c03;
  font-size: 0.46rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 999px;
  background: var(--color-quanta);
}

.preview-copy h2 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 0.76rem;
}

.preview-copy p {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.57rem;
  line-height: 1.35;
}

@media (max-height: 680px) {
  .preview-copy p,
  .chronobot-message {
    display: none;
  }
}
</style>
