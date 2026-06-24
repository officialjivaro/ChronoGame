<template>
  <div class="app-shell">
    <div class="ambient-grid" aria-hidden="true"></div>
    <div class="ambient-glow ambient-glow-left" aria-hidden="true"></div>
    <div class="ambient-glow ambient-glow-right" aria-hidden="true"></div>

    <AppHeader
      :show-home="showHome"
      :show-score="showScore"
      :score="totalScore"
      :online-configured="configured"
      :is-authenticated="isAuthenticated"
      :display-name="displayName"
      :quanta-balance="quantaBalance"
      :quanta-guest="quantaGuest"
      :quanta-wallet-label="walletLabel"
      @open-account="openAccount"
      @open-leaderboard="openLeaderboard"
      @open-store="openStore"
    />

    <main class="app-content">
      <slot></slot>
    </main>

    <AuthModal />
    <LeaderboardModal
      :initial-mode="selectedMode"
      :daily-date-key="dailyDateKey"
    />
    <QuantumBazaarModal />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import AuthModal from '../account/AuthModal.vue'
import LeaderboardModal from '../leaderboard/LeaderboardModal.vue'
import QuantumBazaarModal from '../store/QuantumBazaarModal.vue'
import AppHeader from './AppHeader.vue'

export default {
  name: 'AppShell',
  components: {
    AppHeader,
    AuthModal,
    LeaderboardModal,
    QuantumBazaarModal
  },
  computed: {
    ...mapState(['totalScore', 'selectedMode', 'dailyDateKey']),
    ...mapState('online', ['configured']),
    ...mapState('economy', {
      quantaBalance: 'balance',
      quantaGuest: 'guest'
    }),
    ...mapGetters('online', ['isAuthenticated', 'displayName']),
    ...mapGetters('economy', ['walletLabel']),
    showHome() {
      return this.$route.path === '/game' || this.$route.path === '/results'
    },
    showScore() {
      return this.$route.path === '/game' || this.$route.path === '/results'
    }
  },
  async mounted() {
    await this.$store.dispatch('online/initialize')
    await this.$store.dispatch('economy/initialize')
  },
  methods: {
    openAccount() {
      this.$store.commit('online/setAuthModalOpen', true)
    },
    openLeaderboard() {
      this.$store.commit('online/setLeaderboardOpen', true)
    },
    openStore() {
      this.$store.dispatch('economy/openStore')
    }
  }
}
</script>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: grid;
  grid-template-rows: var(--header-height) minmax(0, 1fr);
  background:
    radial-gradient(circle at 12% 15%, rgba(255, 138, 50, 0.12), transparent 28%),
    radial-gradient(circle at 88% 86%, rgba(91, 99, 116, 0.17), transparent 34%),
    linear-gradient(145deg, #08090c 0%, #1a1d23 52%, #0b0d11 100%);
}

.app-content {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.ambient-grid {
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: clamp(2rem, 4vw, 4.5rem) clamp(2rem, 4vw, 4.5rem);
  mask-image: linear-gradient(to bottom, transparent 2%, #000 30%, #000 76%, transparent 100%);
}

.ambient-glow {
  position: absolute;
  z-index: 0;
  width: 28rem;
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.12;
  pointer-events: none;
}

.ambient-glow-left {
  top: 12%;
  left: -15rem;
  background: var(--color-accent);
}

.ambient-glow-right {
  right: -14rem;
  bottom: -10rem;
  background: #737a89;
}
</style>
