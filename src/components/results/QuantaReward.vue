<template>
  <section :class="['quanta-reward', `reward-${status}`, { 'reward-earned': earned }]" aria-live="polite">
    <div class="reward-coin-wrap">
      <QuantaCoin size="large" />
    </div>

    <div class="reward-copy">
      <span class="reward-kicker">{{ kicker }}</span>
      <strong>{{ headline }}</strong>
      <p>{{ message }}</p>
      <small v-if="showBalanceChange">
        {{ walletLabel }}: {{ previousBalance.toLocaleString() }} → {{ balance.toLocaleString() }}
      </small>
      <small v-else>
        {{ walletLabel }}: {{ balance.toLocaleString() }} Quanta
      </small>
      <small v-if="showDailyProgress" class="daily-progress">
        Rewarded non-daily runs today: {{ rewardedRunsToday }} / 10
      </small>
    </div>

    <div class="reward-side">
      <ChronoBotMessage :message="botMessage" :mood="botMood" :compact="true" />
      <ArcadeButton variant="ghost" size="small" @click="$emit('open-store')">
        Quantum Bazaar
      </ArcadeButton>
    </div>
  </section>
</template>

<script>
import ArcadeButton from '../common/ArcadeButton.vue'
import ChronoBotMessage from '../common/ChronoBotMessage.vue'
import QuantaCoin from '../common/QuantaCoin.vue'
import { CHRONOBOT_MESSAGES } from '../../config/economy.js'

export default {
  name: 'QuantaReward',
  components: {
    ArcadeButton,
    ChronoBotMessage,
    QuantaCoin
  },
  props: {
    status: {
      type: String,
      default: 'idle'
    },
    amount: {
      type: Number,
      default: 0
    },
    previousBalance: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    guest: {
      type: Boolean,
      default: true
    },
    message: {
      type: String,
      default: ''
    },
    rewardedRunsToday: {
      type: Number,
      default: 0
    }
  },
  emits: ['open-store'],
  computed: {
    earned() {
      return ['rewarded', 'guest_rewarded'].includes(this.status) && this.amount > 0
    },
    walletLabel() {
      return this.guest ? 'Guest Quanta' : 'Temporal Wallet'
    },
    kicker() {
      if (this.status === 'saving') return 'Checking Timeline'
      if (this.status === 'save_failed') return 'Wallet Signal Lost'
      if (this.earned) return this.guest ? 'Session Reward' : 'Run Reward'
      return 'Quanta Report'
    },
    headline() {
      if (this.status === 'saving') return 'Saving…'
      if (this.status === 'save_failed') return 'Reward Pending'
      if (this.earned) return `+${this.amount} Quanta`
      if (this.status === 'already_rewarded') return 'Already Rewarded'
      if (this.status === 'daily_already_paid') return 'Daily Already Paid'
      if (this.status === 'daily_cap_reached') return 'Reward Cap Reached'
      if (this.status === 'duplicate') return 'Already Processed'
      if (this.status === 'not_cleared') return 'No Quanta Awarded'
      return 'Temporal Wallet'
    },
    showBalanceChange() {
      return this.earned && this.balance !== this.previousBalance
    },
    showDailyProgress() {
      return !this.guest || this.rewardedRunsToday > 0
    },
    botMood() {
      if (this.earned) return 'rewarded'
      if (this.status === 'save_failed') return 'error'
      if (this.status === 'daily_cap_reached' || this.status === 'not_cleared') return 'warning'
      return 'neutral'
    },
    botMessage() {
      if (this.earned) return CHRONOBOT_MESSAGES.rewarded
      if (this.status === 'save_failed') return CHRONOBOT_MESSAGES.saveFailed
      if (this.status === 'daily_cap_reached') return CHRONOBOT_MESSAGES.capReached
      if (this.status === 'daily_already_paid') return CHRONOBOT_MESSAGES.dailyPaid
      if (this.status === 'not_cleared') return CHRONOBOT_MESSAGES.notCleared
      return this.guest ? CHRONOBOT_MESSAGES.guest : CHRONOBOT_MESSAGES.signedIn
    }
  }
}
</script>

<style scoped>
.quanta-reward {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(12rem, 0.72fr);
  align-items: center;
  gap: clamp(0.55rem, 1.4vw, 0.9rem);
  padding: clamp(0.55rem, 1.4vw, 0.85rem);
  text-align: left;
  border: 1px solid rgba(255, 190, 72, 0.24);
  border-radius: var(--radius-medium);
  background:
    radial-gradient(circle at 5% 50%, rgba(255, 190, 72, 0.15), transparent 28%),
    rgba(0, 0, 0, 0.25);
}

.reward-earned {
  border-color: rgba(255, 190, 72, 0.52);
  box-shadow: 0 0 24px rgba(255, 190, 72, 0.12);
  animation: quanta-reward-glow 900ms ease-out;
}

.reward-earned .quanta-coin {
  animation: quanta-coin-flip 680ms ease-out;
}

.reward-copy {
  min-width: 0;
}

.reward-copy span,
.reward-copy strong,
.reward-copy small {
  display: block;
}

.reward-kicker {
  color: var(--color-text-muted);
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.reward-copy strong {
  margin-top: 0.12rem;
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: clamp(0.85rem, 2vw, 1.25rem);
}

.reward-copy p {
  margin: 0.18rem 0 0.22rem;
  color: var(--color-text-muted);
  font-size: clamp(0.58rem, 0.9vw, 0.72rem);
  line-height: 1.35;
}

.reward-copy small {
  color: var(--color-text);
  font-size: 0.58rem;
}

.daily-progress {
  margin-top: 0.12rem;
  color: var(--color-text-muted) !important;
}

.reward-side {
  display: grid;
  gap: 0.35rem;
}

.reward-save_failed {
  border-color: rgba(255, 93, 93, 0.36);
}

@media (max-width: 720px) {
  .quanta-reward {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .reward-side {
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .reward-side {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 650px) and (min-width: 721px) {
  .reward-side .chronobot-message {
    display: none;
  }
}
</style>
