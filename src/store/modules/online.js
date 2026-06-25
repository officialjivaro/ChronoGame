// Online Account Store | Manages Supabase sessions, profiles, score submissions, and reward handoff
import { isSupabaseConfigured, supabase } from '../../lib/supabase.js'
import {
  fetchProfile,
  submitOnlineScore,
  updateProfileDisplayName
} from '../../services/onlineScores.js'
import { buildOnlineRunPayload } from '../../utils/onlineRunPayload.js'
import {
  CHRONOGAME_GAME_KEY,
  JIVARO_GAMES_PLATFORM_KEY
} from '../../config/platform.js'

let authSubscription = null

function initialState() {
  return {
    configured: isSupabaseConfigured,
    initialized: false,
    session: null,
    user: null,
    profile: null,
    loading: false,
    error: '',
    authModalOpen: false,
    leaderboardOpen: false,
    scoreSaveStatus: 'idle',
    scoreSaveMessage: '',
    lastSavedClientRunId: ''
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    isAuthenticated(state) {
      return Boolean(state.user)
    },
    displayName(state) {
      return state.profile?.display_name || 'Player'
    },
    email(state) {
      return state.user?.email || ''
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
    setSession(state, session) {
      const previousUserId = state.user?.id || ''
      const nextUser = session?.user || null
      state.session = session || null
      state.user = nextUser

      if (previousUserId !== (nextUser?.id || '')) {
        state.profile = null
      }
    },
    setProfile(state, profile) {
      state.profile = profile || null
    },
    setAuthModalOpen(state, value) {
      state.authModalOpen = Boolean(value)
    },
    setLeaderboardOpen(state, value) {
      state.leaderboardOpen = Boolean(value)
    },
    setScoreSaveState(state, payload) {
      state.scoreSaveStatus = payload?.status || 'idle'
      state.scoreSaveMessage = payload?.message || ''

      if (payload?.clientRunId) {
        state.lastSavedClientRunId = payload.clientRunId
      }
    },
    clearAccount(state) {
      state.session = null
      state.user = null
      state.profile = null
      state.scoreSaveStatus = 'idle'
      state.scoreSaveMessage = ''
      state.lastSavedClientRunId = ''
    }
  },
  actions: {
    async initialize({ state, commit, dispatch }) {
      if (state.initialized) return

      if (!state.configured || !supabase) {
        commit('setInitialized', true)
        await dispatch('economy/handleAuthState', null, { root: true })
        await dispatch('cosmetics/handleAuthState', null, { root: true })
        return
      }

      commit('setLoading', true)
      commit('setError', '')

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        commit('setSession', data.session)

        if (data.session?.user) {
          await dispatch('loadProfile')
        }

        await dispatch('economy/handleAuthState', data.session?.user || null, { root: true })
        await dispatch('cosmetics/handleAuthState', data.session?.user || null, { root: true })

        if (!authSubscription) {
          const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            commit('setSession', session)

            window.setTimeout(async () => {
              if (session?.user) {
                await dispatch('loadProfile')
              } else {
                commit('setProfile', null)
              }

              await dispatch('economy/handleAuthState', session?.user || null, { root: true })
              await dispatch('cosmetics/handleAuthState', session?.user || null, { root: true })
            }, 0)
          })

          authSubscription = listener.subscription
        }
      } catch (error) {
        commit('setError', error.message || 'Unable to restore the Jivaro Games account session.')
        await dispatch('economy/handleAuthState', null, { root: true })
        await dispatch('cosmetics/handleAuthState', null, { root: true })
      } finally {
        commit('setLoading', false)
        commit('setInitialized', true)
      }
    },
    async loadProfile({ state, commit }) {
      const userId = state.user?.id
      if (!userId) {
        commit('setProfile', null)
        return null
      }

      try {
        const profile = await fetchProfile(userId)
        if (state.user?.id !== userId) return null
        commit('setProfile', profile)
        return profile
      } catch (error) {
        if (state.user?.id === userId) {
          commit('setProfile', null)
          commit('setError', error.message || 'The Jivaro Games profile could not be loaded.')
        }
        return null
      }
    },
    async requestOtp({ state, commit }, email) {
      if (!state.configured || !supabase) {
        commit('setError', 'Jivaro Games accounts are not configured yet.')
        return false
      }

      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        commit('setError', 'Enter a valid email address.')
        return false
      }

      commit('setLoading', true)
      commit('setError', '')

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: true,
            data: {
              source: CHRONOGAME_GAME_KEY,
              platform: JIVARO_GAMES_PLATFORM_KEY
            }
          }
        })

        if (error) throw error
        return true
      } catch (error) {
        commit('setError', error.message || 'The sign-in code could not be sent.')
        return false
      } finally {
        commit('setLoading', false)
      }
    },
    async verifyOtp({ commit, dispatch }, { email, token }) {
      const normalizedEmail = String(email || '').trim().toLowerCase()
      const normalizedToken = String(token || '').trim().replace(/[\s-]+/g, '')

      if (!normalizedToken) {
        commit('setError', 'Enter the sign-in code from your email.')
        return false
      }

      commit('setLoading', true)
      commit('setError', '')

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: normalizedToken,
          type: 'email'
        })

        if (error) throw error

        commit('setSession', data.session)
        await dispatch('loadProfile')
        await dispatch('economy/handleAuthState', data.session?.user || null, { root: true })
        await dispatch('cosmetics/handleAuthState', data.session?.user || null, { root: true })
        return true
      } catch (error) {
        commit('setError', error.message || 'The sign-in code is invalid or expired.')
        return false
      } finally {
        commit('setLoading', false)
      }
    },
    async updateDisplayName({ state, commit }, displayName) {
      if (!state.user) return false

      commit('setLoading', true)
      commit('setError', '')

      try {
        const profile = await updateProfileDisplayName(state.user.id, displayName)
        commit('setProfile', profile)
        return true
      } catch (error) {
        commit('setError', error.message || 'The display name could not be updated.')
        return false
      } finally {
        commit('setLoading', false)
      }
    },
    async signOut({ commit, dispatch }) {
      if (!supabase) return

      commit('setLoading', true)
      commit('setError', '')

      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        commit('clearAccount')
        await dispatch('economy/handleAuthState', null, { root: true })
        await dispatch('cosmetics/handleAuthState', null, { root: true })
      } catch (error) {
        commit('setError', error.message || 'Unable to sign out.')
      } finally {
        commit('setLoading', false)
      }
    },
    async saveCurrentRun({ state, rootState, commit, dispatch }) {
      const payload = buildOnlineRunPayload(rootState)
      if (!payload) return null

      if (!state.user) {
        const reward = await dispatch('economy/awardGuestRun', payload, { root: true })
        commit('setScoreSaveState', {
          status: 'guest',
          message: reward?.quantaAwarded > 0
            ? `Guest run complete. ${reward.quantaAwarded} temporary Quanta added for this session.`
            : 'Guest run complete. Sign in to save future scores permanently.',
          clientRunId: payload.clientRunId
        })
        return reward
      }

      if (!state.configured) {
        commit('setScoreSaveState', {
          status: 'unavailable',
          message: 'Online scoring has not been configured for this build.'
        })
        return null
      }

      if (state.lastSavedClientRunId === payload.clientRunId && state.scoreSaveStatus === 'saved') {
        return null
      }

      commit('setScoreSaveState', {
        status: 'saving',
        message: 'Saving this run and checking Quanta rewards…'
      })
      commit('economy/setRewardState', {
        status: 'saving',
        amount: 0,
        message: 'ChronoBot is checking the timeline ledger.',
        previousBalance: rootState.economy?.balance,
        newBalance: rootState.economy?.balance
      }, { root: true })

      try {
        const saved = await submitOnlineScore(payload)
        await dispatch('economy/applyServerReward', saved, { root: true })

        const dailyMessage = payload.mode === 'daily'
          ? saved.dailyOfficial
            ? 'Official Daily Challenge score saved.'
            : 'Practice Daily Challenge score saved.'
          : 'ChronoGame score saved to your Jivaro Games account.'

        commit('setScoreSaveState', {
          status: 'saved',
          message: saved.inserted === false ? 'This run was already saved.' : dailyMessage,
          clientRunId: payload.clientRunId
        })
        return saved
      } catch (error) {
        commit('setScoreSaveState', {
          status: 'error',
          message: error.message || 'The online score could not be saved.'
        })
        await dispatch('economy/recordSaveFailure', null, { root: true })
        return null
      }
    },
    resetScoreSaveStatus({ commit, dispatch }) {
      commit('setScoreSaveState', { status: 'idle', message: '' })
      dispatch('economy/resetReward', null, { root: true })
    }
  }
}
