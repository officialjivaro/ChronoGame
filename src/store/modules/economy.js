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
    accountUserId: '',
    balance: 0,
    previousBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    guest: true,
    loading: false,
    error: '',
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
      return state.guest ? 'Guest Quanta' : 'Shared Quanta Wallet'
    },
    isGuestWallet(state) {
      return state.guest
    }
  },
  mutations: {
    setInitialized(state, value) {
      state.initialized = Boolean(value)
    },
    setAccountUserId(state, userId) {
      state.accountUserId = userId || ''
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
    applyPurchaseBalance(state, payload) {
      const pricePaid = Math.max(0, Number(payload?.pricePaid) || 0)
      const previousBalance = payload?.previousBalance === undefined
        ? state.balance
        : Number(payload.previousBalance)
      const newBalance = payload?.newBalance === undefined
        ? state.balance
        : Number(payload.newBalance)
      state.previousBalance = Math.max(0, Number.isFinite(previousBalance) ? previousBalance : state.balance)
      state.balance = Math.max(0, Number.isFinite(newBalance) ? newBalance : state.balance)
      state.lifetimeSpent = Math.max(0, state.lifetimeSpent + pricePaid)
      state.guest = false
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
    async handleAuthState({ state, dispatch, commit }, user) {
      if (user?.id) {
        if (state.accountUserId !== user.id) {
          commit('setAccountUserId', user.id)
          commit('setWallet', {
            balance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0,
            guest: false
          })
          commit('setDayStatus', { rewardedRunsToday: 0, dailyRewardClaimed: false })
          commit('setError', '')
        }
        return dispatch('loadPermanentWallet', user)
      }

      return dispatch('loadGuestWallet')
    },
    async loadPermanentWallet({ state, rootState, commit }, user) {
      if (!user?.id) return null

      commit('setLoading', true)
      commit('setError', '')

      try {
        const overview = await fetchQuantaOverview(user.id)
        if (state.accountUserId !== user.id || rootState.online?.user?.id !== user.id) return null

        commit('setWallet', {
          balance: overview.wallet.balance,
          lifetimeEarned: overview.wallet.lifetime_earned,
          lifetimeSpent: overview.wallet.lifetime_spent,
          guest: false
        })
        commit('setDayStatus', overview)
        return overview
      } catch (error) {
        if (state.accountUserId === user.id && rootState.online?.user?.id === user.id) {
          commit('setError', error.message || 'The shared Quanta wallet could not be loaded.')
        }
        return null
      } finally {
        if (state.accountUserId === user.id) commit('setLoading', false)
      }
    },
    loadGuestWallet({ commit }) {
      commit('setAccountUserId', '')
      commit('setLoading', false)
      commit('setError', '')
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
    async applyPurchaseResult({ rootState, commit, dispatch }, result) {
      commit('applyPurchaseBalance', result)

      if (rootState.online?.user?.id) {
        await dispatch('loadPermanentWallet', rootState.online.user)
      }

      return result
    },
    resetReward({ commit }) {
      commit('resetRewardState')
    }
  }
}
