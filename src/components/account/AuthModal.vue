<template>
  <transition name="modal-fade">
    <div
      v-if="authModalOpen"
      class="account-overlay"
      role="presentation"
      @click.self="close"
    >
      <ArcadePanel class="account-modal" :accent="true" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button class="modal-close" type="button" aria-label="Close account panel" @click="close">×</button>

        <div class="account-heading">
          <span>{{ platformName }} Account</span>
          <h2 id="account-title">{{ isAuthenticated ? `${platformName} Profile` : `Sign In to ${platformName}` }}</h2>
          <p v-if="!isAuthenticated">
            Use one Jivaro Games account for permanent Quanta and ChronoGame scores. Guests can still play without signing in.
          </p>
        </div>

        <div v-if="!configured" class="account-notice" role="status">
          <strong>Supabase is not configured.</strong>
          <span>Add the project URL and publishable key to <code>.env.local</code>.</span>
        </div>

        <template v-else-if="isAuthenticated">
          <div class="account-details">
            <span>Signed in as</span>
            <strong>{{ email }}</strong>
          </div>

          <form class="account-form" @submit.prevent="saveDisplayName">
            <label for="display-name">Leaderboard display name</label>
            <input
              id="display-name"
              v-model.trim="displayNameInput"
              type="text"
              minlength="3"
              maxlength="24"
              autocomplete="nickname"
              required
            />
            <small>3–24 characters. Your email is never shown on the leaderboard.</small>
            <ArcadeButton type="submit" :block="true" :disabled="loading">
              {{ loading ? 'Saving…' : 'Save Display Name' }}
            </ArcadeButton>
          </form>

          <ArcadeButton variant="secondary" :block="true" :disabled="loading" @click="signOut">
            Sign Out
          </ArcadeButton>
        </template>

        <template v-else>
          <form v-if="step === 'email'" class="account-form" @submit.prevent="sendCode">
            <label for="account-email">Email address</label>
            <input
              id="account-email"
              v-model.trim="emailInput"
              type="email"
              autocomplete="email"
              placeholder="player@example.com"
              required
            />
            <small>New emails automatically create a Jivaro Games account.</small>
            <ArcadeButton type="submit" :block="true" :disabled="loading">
              {{ loading ? 'Sending…' : 'Email Me a Code' }}
            </ArcadeButton>
          </form>

          <form v-else class="account-form" @submit.prevent="verifyCode">
            <div class="code-sent">
              <span>Code sent to</span>
              <strong>{{ emailInput }}</strong>
            </div>
            <label for="account-code">Sign-in code</label>
            <input
              id="account-code"
              v-model="tokenInput"
              class="otp-input"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="Enter the code"
              required
            />
            <ArcadeButton type="submit" :block="true" :disabled="loading">
              {{ loading ? 'Checking…' : 'Sign In' }}
            </ArcadeButton>
            <button class="text-button" type="button" :disabled="loading" @click="step = 'email'">
              Use a different email
            </button>
          </form>
        </template>

        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        <p v-if="successMessage" class="account-success" role="status">{{ successMessage }}</p>
      </ArcadePanel>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ArcadeButton from '../common/ArcadeButton.vue'
import ArcadePanel from '../common/ArcadePanel.vue'
import { JIVARO_GAMES_NAME } from '../../config/platform.js'

export default {
  name: 'AuthModal',
  components: {
    ArcadeButton,
    ArcadePanel
  },
  data() {
    return {
      platformName: JIVARO_GAMES_NAME,
      step: 'email',
      emailInput: '',
      tokenInput: '',
      displayNameInput: '',
      successMessage: ''
    }
  },
  computed: {
    ...mapState('online', [
      'authModalOpen',
      'configured',
      'loading',
      'error',
      'profile'
    ]),
    ...mapGetters('online', ['isAuthenticated', 'email'])
  },
  watch: {
    authModalOpen(open) {
      if (!open) return
      this.successMessage = ''
      this.tokenInput = ''
      this.step = this.isAuthenticated ? 'account' : 'email'
      this.displayNameInput = this.profile?.display_name || ''
      window.addEventListener('keydown', this.handleKeydown)
    },
    profile: {
      immediate: true,
      handler(profile) {
        if (profile?.display_name) {
          this.displayNameInput = profile.display_name
        }
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    close() {
      this.$store.commit('online/setAuthModalOpen', false)
      this.$store.commit('online/setError', '')
      this.successMessage = ''
      window.removeEventListener('keydown', this.handleKeydown)
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close()
    },
    async sendCode() {
      this.successMessage = ''
      const sent = await this.$store.dispatch('online/requestOtp', this.emailInput)

      if (sent) {
        this.step = 'code'
        this.successMessage = `Check your inbox for the ${this.platformName} sign-in code.`
      }
    },
    async verifyCode() {
      this.successMessage = ''
      const signedIn = await this.$store.dispatch('online/verifyOtp', {
        email: this.emailInput,
        token: this.tokenInput
      })

      if (signedIn) {
        this.step = 'account'
        this.successMessage = `Signed in to ${this.platformName}. Future ChronoGame runs can now be saved online.`
      }
    },
    async saveDisplayName() {
      this.successMessage = ''
      const saved = await this.$store.dispatch('online/updateDisplayName', this.displayNameInput)

      if (saved) {
        this.successMessage = 'Display name updated.'
      }
    },
    async signOut() {
      await this.$store.dispatch('online/signOut')
      this.step = 'email'
      this.successMessage = 'Signed out. Guest Quanta remain temporary for this browser session.'
    }
  }
}
</script>

<style scoped>
.account-overlay {
  position: fixed;
  z-index: calc(var(--z-modal) + 20);
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(0.65rem, 3vw, 2rem);
  background: rgba(3, 4, 6, 0.82);
  backdrop-filter: blur(8px);
}

.account-modal {
  width: min(30rem, 100%);
  max-height: min(90dvh, 44rem);
  display: grid;
  gap: var(--space-3);
  padding: clamp(1rem, 3vw, 1.8rem);
  overflow: auto;
}

.modal-close {
  position: absolute;
  z-index: 3;
  top: 0.7rem;
  right: 0.8rem;
  width: 2.35rem;
  height: 2.35rem;
  color: var(--color-text);
  font-size: 1.7rem;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-small);
  background: #20232a;
  cursor: pointer;
}

.account-heading span,
.account-details span,
.account-form label,
.code-sent span {
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.account-heading h2 {
  margin: 0.3rem 0 0.45rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 5vw, 2.2rem);
}

.account-heading p,
.account-form small,
.account-notice span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.5;
}

.account-details,
.code-sent,
.account-notice {
  display: grid;
  gap: 0.25rem;
  padding: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-small);
  background: rgba(0, 0, 0, 0.24);
}

.account-details strong,
.code-sent strong,
.account-notice strong {
  overflow-wrap: anywhere;
  color: var(--color-accent-bright);
}

.account-form {
  display: grid;
  gap: 0.65rem;
}

.account-form input {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.65rem 0.75rem;
  color: var(--color-text);
  border: 1px solid #525762;
  border-radius: var(--radius-small);
  background: #101216;
}

.otp-input {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.45rem;
  letter-spacing: 0.4em;
}

.text-button {
  color: var(--color-accent-bright);
  background: transparent;
  cursor: pointer;
}

.account-error,
.account-success {
  margin: 0;
  font-size: 0.72rem;
  text-align: center;
}

.account-error {
  color: var(--color-danger);
}

.account-success {
  color: var(--color-success);
}
</style>
