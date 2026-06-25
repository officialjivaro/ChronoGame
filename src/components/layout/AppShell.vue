<template>
  <div
    :class="['app-shell', { 'route-gameplay': isGameplay }]"
    :data-ui-skin="equippedSkinId"
  >
    <EquippedBackground :item="equippedBackground" :gameplay="isGameplay" />
    <div class="ambient-grid" aria-hidden="true"></div>
    <div class="ambient-glow ambient-glow-left" aria-hidden="true"></div>
    <div class="ambient-glow ambient-glow-right" aria-hidden="true"></div>
    <div class="cabinet-corners" aria-hidden="true"></div>

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

    <EquippedPetDock :pet="equippedPet" :visible="showPetDock" />

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
import EquippedBackground from '../cosmetics/EquippedBackground.vue'
import EquippedPetDock from '../cosmetics/EquippedPetDock.vue'
import LeaderboardModal from '../leaderboard/LeaderboardModal.vue'
import QuantumBazaarModal from '../store/QuantumBazaarModal.vue'
import AppHeader from './AppHeader.vue'

export default {
  name: 'AppShell',
  components: {
    AppHeader,
    AuthModal,
    EquippedBackground,
    EquippedPetDock,
    LeaderboardModal,
    QuantumBazaarModal
  },
  computed: {
    ...mapState(['totalScore', 'selectedMode', 'dailyDateKey']),
    ...mapState('online', ['configured', 'authModalOpen', 'leaderboardOpen']),
    ...mapState('economy', {
      quantaBalance: 'balance',
      quantaGuest: 'guest'
    }),
    ...mapState('cosmetics', ['bazaarOpen']),
    ...mapGetters('online', ['isAuthenticated', 'displayName']),
    ...mapGetters('economy', ['walletLabel']),
    ...mapGetters('cosmetics', ['equippedBackground', 'equippedSkinId', 'equippedPet']),
    showHome() {
      return this.$route.path === '/game' || this.$route.path === '/results'
    },
    showScore() {
      return this.$route.path === '/game' || this.$route.path === '/results'
    },
    isGameplay() {
      return this.$route.path === '/game'
    },
    showPetDock() {
      const safeRoute = this.$route.path === '/' || this.$route.path === '/results'
      const modalOpen = this.authModalOpen || this.leaderboardOpen || this.bazaarOpen
      return safeRoute && !modalOpen && Boolean(this.equippedPet)
    }
  },
  async mounted() {
    await this.$store.dispatch('online/initialize')
    await Promise.all([
      this.$store.dispatch('economy/initialize'),
      this.$store.dispatch('cosmetics/initialize')
    ])
  },
  methods: {
    openAccount() {
      this.$store.commit('online/setAuthModalOpen', true)
    },
    openLeaderboard() {
      this.$store.commit('online/setLeaderboardOpen', true)
    },
    openStore() {
      this.$store.dispatch('cosmetics/openBazaar')
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
    radial-gradient(circle at 12% 15%, rgba(var(--color-accent-rgb), 0.12), transparent 28%),
    radial-gradient(circle at 88% 86%, rgba(91, 99, 116, 0.17), transparent 34%),
    linear-gradient(145deg, #08090c 0%, #1a1d23 52%, #0b0d11 100%);
}

.app-content {
  position: relative;
  z-index: 3;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.ambient-grid {
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  opacity: var(--ambient-grid-opacity);
  background-image:
    linear-gradient(rgba(var(--color-accent-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--color-accent-rgb), 0.04) 1px, transparent 1px);
  background-size: clamp(2rem, 4vw, 4.5rem) clamp(2rem, 4vw, 4.5rem);
  mask-image: linear-gradient(to bottom, transparent 2%, #000 30%, #000 76%, transparent 100%);
}

.ambient-glow {
  position: absolute;
  z-index: 1;
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
  background: var(--color-secondary-glow);
}

.cabinet-corners {
  position: absolute;
  z-index: 4;
  inset: calc(var(--header-height) + 0.35rem) 0.35rem 0.35rem;
  pointer-events: none;
  border: 1px solid rgba(var(--color-accent-rgb), 0.08);
  clip-path: polygon(1.15rem 0, calc(100% - 1.15rem) 0, 100% 1.15rem, 100% calc(100% - 1.15rem), calc(100% - 1.15rem) 100%, 1.15rem 100%, 0 calc(100% - 1.15rem), 0 1.15rem);
}

.route-gameplay .ambient-grid {
  opacity: calc(var(--ambient-grid-opacity) * 0.55);
}
</style>
