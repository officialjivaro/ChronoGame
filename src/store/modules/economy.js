// Economy Store | Coordinates permanent Supabase wallets and session-only guest Quanta
import {
  CHRONOBOT_MESSAGES,
  getQuantaRewardMessage
} from '../../config/economy.js'
import { fetchQuantaOverview } from '../../services/quanta.js'
import {
  awardGuestQuanta,
  getGuestRewardOverview
} from '../../utils/guestQuanta.js'

function initialState() {
  return {
    initialized: false,
    balance: 0,
    previousBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    guest: true,
    loading: false,
    error: '',
    storeOpen: false,
    rewardStatus: 'idle',
    rewardAmount: 0,
    rewardMessage: '',
    rewardedRunsToday: 0,
    dailyRewardClaimed: false
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    formattedBalance(state) {
      return Number(state.balance || 0).toLocaleString()
    },
    walletLabel(state) {
      return state.guest ? 'Guest Quanta' : 'Temporal Wallet'
    },
    isGuestWallet(state) {
      return state.guest
    }
  },
  mutations: {
    setInitialized(state, value) {
      state.initialized = Boolean(value)
    },
    setLoading(state, value) {
      state.loading = Boolean(value)
    },
    setError(state, value) {
      state.error = value || ''
    },
    setWallet(state, payload) {
      state.balance = Math.max(0, Number(payload?.balance) || 0)
      state.lifetimeEarned = Math.max(0, Number(payload?.lifetimeEarned) || 0)
      state.lifetimeSpent = Math.max(0, Number(payload?.lifetimeSpent) || 0)
      state.guest = Boolean(payload?.guest)
    },
    setDayStatus(state, payload) {
      state.rewardedRunsToday = Math.max(0, Number(payload?.rewardedRunsToday) || 0)
      state.dailyRewardClaimed = Boolean(payload?.dailyRewardClaimed)
    },
    setStoreOpen(state, value) {
      state.storeOpen = Boolean(value)
    },
    setRewardState(state, payload) {
      state.rewardStatus = payload?.status || 'idle'
      state.rewardAmount = Math.max(0, Number(payload?.amount) || 0)
      state.rewardMessage = payload?.message || ''
      state.previousBalance = Math.max(0, Number(payload?.previousBalance) || 0)

      if (payload?.newBalance !== undefined) {
        state.balance = Math.max(0, Number(payload.newBalance) || 0)
      }

      if (payload?.rewardedRunsToday !== undefined) {
        state.rewardedRunsToday = Math.max(0, Number(payload.rewardedRunsToday) || 0)
      }

      if (payload?.dailyRewardClaimed !== undefined) {
        state.dailyRewardClaimed = Boolean(payload.dailyRewardClaimed)
      }
    },
    resetRewardState(state) {
      state.rewardStatus = 'idle'
      state.rewardAmount = 0
      state.rewardMessage = ''
      state.previousBalance = state.balance
    }
  },
  actions: {
    async initialize({ state, rootState, dispatch, commit }) {
      if (state.initialized) return

      try {
        await dispatch('handleAuthState', rootState.online?.user || null)
      } finally {
        commit('setInitialized', true)
      }
    },
    async handleAuthState({ dispatch }, user) {
      if (user?.id) {
        return dispatch('loadPermanentWallet', user)
      }

      return dispatch('loadGuestWallet')
    },
    async loadPermanentWallet({ commit }, user) {
      if (!user?.id) return null

      commit('setLoading', true)
      commit('setError', '')

      try {
        const overview = await fetchQuantaOverview(user.id)
        commit('setWallet', {
          balance: overview.wallet.balance,
          lifetimeEarned: overview.wallet.lifetime_earned,
          lifetimeSpent: overview.wallet.lifetime_spent,
          guest: false
        })
        commit('setDayStatus', overview)
        return overview
      } catch (error) {
        commit('setError', error.message || 'The Temporal Wallet could not be loaded.')
        return null
      } finally {
        commit('setLoading', false)
      }
    },
    loadGuestWallet({ commit }) {
      const overview = getGuestRewardOverview()
      commit('setWallet', {
        balance: overview.balance,
        lifetimeEarned: overview.balance,
        lifetimeSpent: 0,
        guest: true
      })
      commit('setDayStatus', overview)
      return overview
    },
    async applyServerReward({ rootState, commit, dispatch }, result) {
      const status = result?.rewardStatus || 'not_cleared'
      const modeId = rootState.selectedMode
      const amount = Math.max(0, Number(result?.quantaAwarded) || 0)

      commit('setRewardState', {
        status,
        amount,
        message: result?.rewardMessage || getQuantaRewardMessage(status, modeId, amount),
        previousBalance: result?.previousBalance,
        newBalance: result?.newBalance,
        rewardedRunsToday: result?.rewardedRunsToday,
        dailyRewardClaimed: result?.dailyRewardClaimed
      })

      if (rootState.online?.user?.id) {
        await dispatch('loadPermanentWallet', rootState.online.user)
      }

      return result
    },
    awardGuestRun({ commit }, payload) {
      const result = awardGuestQuanta(payload)

      commit('setWallet', {
        balance: result.newBalance,
        lifetimeEarned: result.newBalance,
        lifetimeSpent: 0,
        guest: true
      })
      commit('setRewardState', {
        status: result.rewardStatus,
        amount: result.quantaAwarded,
        message: result.message,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        rewardedRunsToday: result.rewardedRunsToday,
        dailyRewardClaimed: result.dailyRewardClaimed
      })

      return result
    },
    recordSaveFailure({ commit }) {
      commit('setRewardState', {
        status: 'save_failed',
        amount: 0,
        message: CHRONOBOT_MESSAGES.saveFailed
      })
    },
    resetReward({ commit }) {
      commit('resetRewardState')
    },
    openStore({ commit }) {
      commit('setStoreOpen', true)
    },
    closeStore({ commit }) {
      commit('setStoreOpen', false)
    }
  }
}
