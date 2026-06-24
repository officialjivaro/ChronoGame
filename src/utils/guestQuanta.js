// Guest Quanta | Session-only wallet with duplicate and daily reward protection
import {
  NON_DAILY_REWARD_CAP,
  getModeQuantaReward,
  getQuantaRewardMessage,
  getUtcDateKey,
  isRunCleared
} from '../config/economy.js'

const STORAGE_KEY = 'chronogame_guest_quanta_v1'
const STORAGE_VERSION = 1
const MAX_PROCESSED_RUNS = 100
let fallbackWallet = null

function createDefaultWallet() {
  return {
    version: STORAGE_VERSION,
    balance: 0,
    processedRunIds: [],
    rewardedRunIds: [],
    nonDailyRewardsByDate: {},
    dailyRewardDates: []
  }
}

function getStorage() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null
    const testKey = `${STORAGE_KEY}_test`
    window.sessionStorage.setItem(testKey, '1')
    window.sessionStorage.removeItem(testKey)
    return window.sessionStorage
  } catch (_error) {
    return null
  }
}

function normalizeWallet(value) {
  const wallet = value && typeof value === 'object' ? value : {}
  const defaults = createDefaultWallet()

  return {
    version: STORAGE_VERSION,
    balance: Math.max(0, Number(wallet.balance) || 0),
    processedRunIds: Array.isArray(wallet.processedRunIds)
      ? wallet.processedRunIds.map(String).slice(-MAX_PROCESSED_RUNS)
      : defaults.processedRunIds,
    rewardedRunIds: Array.isArray(wallet.rewardedRunIds)
      ? wallet.rewardedRunIds.map(String).slice(-MAX_PROCESSED_RUNS)
      : defaults.rewardedRunIds,
    nonDailyRewardsByDate: wallet.nonDailyRewardsByDate && typeof wallet.nonDailyRewardsByDate === 'object'
      ? wallet.nonDailyRewardsByDate
      : defaults.nonDailyRewardsByDate,
    dailyRewardDates: Array.isArray(wallet.dailyRewardDates)
      ? wallet.dailyRewardDates.map(String).slice(-45)
      : defaults.dailyRewardDates
  }
}

function saveWallet(wallet) {
  const normalized = normalizeWallet(wallet)
  fallbackWallet = normalized
  const storage = getStorage()

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    } catch (_error) {
      fallbackWallet = normalized
    }
  }

  return normalized
}

export function loadGuestQuantaWallet() {
  const storage = getStorage()

  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw) return saveWallet(JSON.parse(raw))
    } catch (_error) {
      storage.removeItem(STORAGE_KEY)
    }
  }

  return saveWallet(fallbackWallet || createDefaultWallet())
}

export function getGuestRewardOverview(dateKey = getUtcDateKey()) {
  const wallet = loadGuestQuantaWallet()

  return {
    balance: wallet.balance,
    rewardedRunsToday: Math.max(0, Number(wallet.nonDailyRewardsByDate[dateKey]) || 0),
    dailyRewardClaimed: wallet.dailyRewardDates.includes(dateKey)
  }
}

export function awardGuestQuanta(payload) {
  const wallet = loadGuestQuantaWallet()
  const clientRunId = String(payload?.clientRunId || '')
  const modeId = String(payload?.mode || '')
  const today = getUtcDateKey()
  const previousBalance = wallet.balance
  const alreadyProcessed = clientRunId && wallet.processedRunIds.includes(clientRunId)

  if (!clientRunId) {
    return {
      rewardStatus: 'not_cleared',
      quantaAwarded: 0,
      previousBalance,
      newBalance: wallet.balance,
      rewardedRunsToday: Number(wallet.nonDailyRewardsByDate[today]) || 0,
      dailyRewardClaimed: wallet.dailyRewardDates.includes(today),
      message: 'This run has no valid reward identifier.'
    }
  }

  if (alreadyProcessed) {
    const wasRewarded = wallet.rewardedRunIds.includes(clientRunId)
    return {
      rewardStatus: wasRewarded ? 'already_rewarded' : 'duplicate',
      quantaAwarded: 0,
      previousBalance: wallet.balance,
      newBalance: wallet.balance,
      rewardedRunsToday: Number(wallet.nonDailyRewardsByDate[today]) || 0,
      dailyRewardClaimed: wallet.dailyRewardDates.includes(today),
      message: getQuantaRewardMessage(wasRewarded ? 'already_rewarded' : 'duplicate', modeId)
    }
  }

  wallet.processedRunIds.push(clientRunId)
  wallet.processedRunIds = wallet.processedRunIds.slice(-MAX_PROCESSED_RUNS)

  let rewardStatus = 'not_cleared'
  let quantaAwarded = 0

  if (isRunCleared(payload)) {
    if (modeId === 'daily') {
      const rewardDate = String(payload.dailyDate || today)

      if (wallet.dailyRewardDates.includes(rewardDate)) {
        rewardStatus = 'daily_already_paid'
      } else {
        quantaAwarded = getModeQuantaReward(modeId)
        rewardStatus = 'guest_rewarded'
        wallet.dailyRewardDates.push(rewardDate)
        wallet.dailyRewardDates = wallet.dailyRewardDates.slice(-45)
      }
    } else {
      const rewardedToday = Math.max(0, Number(wallet.nonDailyRewardsByDate[today]) || 0)

      if (rewardedToday >= NON_DAILY_REWARD_CAP) {
        rewardStatus = 'daily_cap_reached'
      } else {
        quantaAwarded = getModeQuantaReward(modeId)
        rewardStatus = 'guest_rewarded'
        wallet.nonDailyRewardsByDate[today] = rewardedToday + 1
      }
    }
  }

  if (quantaAwarded > 0) {
    wallet.balance += quantaAwarded
    wallet.rewardedRunIds.push(clientRunId)
    wallet.rewardedRunIds = wallet.rewardedRunIds.slice(-MAX_PROCESSED_RUNS)
  }

  const saved = saveWallet(wallet)

  return {
    rewardStatus,
    quantaAwarded,
    previousBalance,
    newBalance: saved.balance,
    rewardedRunsToday: Math.max(0, Number(saved.nonDailyRewardsByDate[today]) || 0),
    dailyRewardClaimed: saved.dailyRewardDates.includes(String(payload.dailyDate || today)),
    message: getQuantaRewardMessage(rewardStatus, modeId, quantaAwarded)
  }
}
