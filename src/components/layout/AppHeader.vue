<template>
  <header class="app-header">
    <nav class="header-navigation" aria-label="ChronoGame navigation">
      <a
        class="header-link"
        href="https://jivaro.net/games"
        target="_top"
        aria-label="Return to Games"
      >
        <span class="header-link-icon" aria-hidden="true">←</span>
        <span class="header-link-label">Games</span>
      </a>

      <router-link
        v-if="showHome"
        class="header-link"
        to="/"
        aria-label="Return to the ChronoGame home screen"
      >
        <span class="header-link-icon" aria-hidden="true">⌂</span>
        <span class="header-link-label">Home</span>
      </router-link>
    </nav>

    <div class="brand" aria-label="ChronoGame, Guess the Release Year">
      <div class="brand-name">
        <span>Chrono</span><span class="brand-accent">Game</span>
      </div>
      <div class="brand-subtitle">Guess the Release Year</div>
    </div>

    <div class="header-tools">
      <div v-if="showScore" class="header-score" aria-label="Current total score">
        <span class="score-label">Score</span>
        <strong>{{ formattedScore }}</strong>
      </div>

      <button
        class="header-tool-button wallet-button"
        type="button"
        :aria-label="`${quantaWalletLabel}: ${formattedQuanta} Quanta. Open Quantum Bazaar.`"
        @click="$emit('open-store')"
      >
        <QuantaCoin />
        <span class="wallet-copy">
          <span class="tool-label">{{ quantaGuest ? 'Guest Q' : 'Wallet' }}</span>
          <strong>{{ formattedQuanta }}</strong>
        </span>
      </button>

      <button
        v-if="onlineConfigured"
        class="header-tool-button leaderboard-button"
        type="button"
        aria-label="Open online leaderboards"
        @click="$emit('open-leaderboard')"
      >
        <span class="tool-icon" aria-hidden="true">★</span>
        <span class="tool-label">Ranks</span>
      </button>

      <button
        v-if="onlineConfigured"
        class="header-tool-button account-button"
        type="button"
        :aria-label="accountAriaLabel"
        @click="$emit('open-account')"
      >
        <span class="tool-icon" aria-hidden="true">●</span>
        <span class="tool-label">{{ isAuthenticated ? displayName : 'Sign In' }}</span>
      </button>
    </div>
  </header>
</template>

<script>
import QuantaCoin from '../common/QuantaCoin.vue'
import { JIVARO_GAMES_NAME } from '../../config/platform.js'

export default {
  name: 'AppHeader',
  components: {
    QuantaCoin
  },
  props: {
    showHome: {
      type: Boolean,
      default: false
    },
    showScore: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    onlineConfigured: {
      type: Boolean,
      default: false
    },
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    displayName: {
      type: String,
      default: 'Player'
    },
    quantaBalance: {
      type: Number,
      default: 0
    },
    quantaGuest: {
      type: Boolean,
      default: true
    },
    quantaWalletLabel: {
      type: String,
      default: 'Guest Quanta'
    }
  },
  emits: ['open-account', 'open-leaderboard', 'open-store'],
  computed: {
    formattedScore() {
      return this.score.toLocaleString()
    },
    formattedQuanta() {
      return this.quantaBalance.toLocaleString()
    },
    accountAriaLabel() {
      return this.isAuthenticated
        ? `Open ${JIVARO_GAMES_NAME} account for ${this.displayName}`
        : `Sign in to ${JIVARO_GAMES_NAME}`
    }
  }
}
</script>

<style scoped>
.app-header {
  position: relative;
  z-index: var(--z-header);
  width: 100%;
  height: var(--header-height);
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(var(--color-accent-rgb), 0.75);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 35%),
    linear-gradient(135deg, var(--color-panel-deep) 0%, var(--color-panel-soft) 55%, var(--color-panel-deep) 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.48), 0 -1px 0 rgba(255, 255, 255, 0.04) inset;
}

.app-header::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  box-shadow: 0 0 15px rgba(var(--color-accent-rgb), 0.72);
}

.header-navigation,
.header-tools {
  position: absolute;
  z-index: 1;
  top: 50%;
  display: flex;
  align-items: center;
  gap: clamp(0.15rem, 0.55vw, 0.48rem);
  transform: translateY(-50%);
}

.header-navigation {
  left: clamp(0.4rem, 1.7vw, 1.6rem);
}

.header-tools {
  right: clamp(0.4rem, 1.7vw, 1.6rem);
  justify-content: flex-end;
  max-width: 46%;
}

.header-link,
.header-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 2.35rem;
  padding: 0.42rem 0.72rem;
  color: var(--color-text);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  clip-path: polygon(0.35rem 0, 100% 0, 100% calc(100% - 0.35rem), calc(100% - 0.35rem) 100%, 0 100%, 0 0.35rem);
  background: var(--gradient-button-secondary);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.38), 0 1px 0 rgba(255, 255, 255, 0.09) inset;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.header-link:hover,
.header-tool-button:hover {
  color: #fff;
  border-color: rgba(var(--color-accent-rgb), 0.72);
  transform: translateY(-2px);
  box-shadow: 0 9px 20px rgba(0, 0, 0, 0.48), 0 0 16px rgba(var(--color-accent-rgb), 0.2);
}

.header-link-icon,
.tool-icon {
  color: var(--color-accent-bright);
  font-size: 1.05rem;
  line-height: 1;
}

.header-link-label,
.tool-label,
.score-label {
  font-size: clamp(0.64rem, 0.9vw, 0.8rem);
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.account-button .tool-label {
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallet-button {
  border-color: rgba(255, 190, 72, 0.28);
}

.wallet-copy {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.wallet-copy strong {
  color: var(--color-quanta-highlight);
  font-family: var(--font-display);
  font-size: 0.82rem;
}

.brand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: max-content;
  max-width: 31%;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.brand-name {
  font-family: var(--font-display);
  font-size: clamp(1rem, 2.8vw, 2rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.045em;
  color: var(--color-text);
  text-shadow: var(--shadow-text), 0 0 17px rgba(var(--color-accent-rgb), 0.16);
}

.brand-accent {
  color: var(--color-accent-bright);
}

.brand-subtitle {
  margin-top: clamp(0.15rem, 0.55vh, 0.35rem);
  color: var(--color-text-muted);
  font-size: clamp(0.6rem, 1vw, 0.72rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.header-score {
  display: flex;
  align-items: baseline;
  gap: 0.42rem;
  padding: 0.38rem 0.62rem;
  border: 1px solid rgba(255, 138, 50, 0.28);
  border-radius: var(--radius-small);
  background: rgba(5, 6, 8, 0.52);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.32) inset;
}

.score-label {
  color: var(--color-text-muted);
}

.header-score strong {
  color: var(--color-accent-bright);
  font-family: var(--font-display);
  font-size: clamp(0.7rem, 1.35vw, 0.95rem);
}

@media (max-width: 1040px) {
  .header-link,
  .header-tool-button {
    min-width: 2.35rem;
    padding-inline: 0.52rem;
  }

  .header-link-label,
  .tool-label,
  .score-label,
  .brand-subtitle {
    display: none;
  }

  .brand {
    max-width: 32%;
  }

  .header-score {
    padding-inline: 0.48rem;
  }
}

@media (max-width: 560px) {
  .header-navigation,
  .header-tools {
    gap: 0.12rem;
  }

  .header-link,
  .header-tool-button {
    min-width: 1.95rem;
    min-height: 2rem;
    padding-inline: 0.3rem;
  }

  .tool-icon,
  .header-link-icon {
    font-size: 0.88rem;
  }

  .wallet-button {
    gap: 0.22rem;
  }

  .wallet-copy strong {
    font-size: 0.64rem;
  }

  .brand {
    max-width: 28%;
  }

  .brand-name {
    font-size: clamp(0.72rem, 4.4vw, 1rem);
  }

  .header-score {
    display: none;
  }

  .leaderboard-button {
    display: none;
  }

  .header-score strong {
    font-size: 0.6rem;
  }
}
</style>
