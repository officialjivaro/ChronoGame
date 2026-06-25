// Quanta Service | Reads the authenticated wallet and current UTC reward limits
import { requireSupabase } from '../lib/supabase.js'
import { getUtcDateKey } from '../config/economy.js'
import { CHRONOGAME_GAME_KEY } from '../config/platform.js'

function emptyWallet(userId = '') {
  return {
    user_id: userId,
    balance: 0,
    lifetime_earned: 0,
    lifetime_spent: 0,
    created_at: null,
    updated_at: null
  }
}

export async function fetchQuantaWallet(userId) {
  if (!userId) return emptyWallet()

  const client = requireSupabase()
  const { data, error } = await client
    .from('quanta_wallets')
    .select('user_id, balance, lifetime_earned, lifetime_spent, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data || emptyWallet(userId)
}

export async function fetchQuantaDayStatus(userId, dateKey = getUtcDateKey()) {
  if (!userId) {
    return {
      rewardedRunsToday: 0,
      dailyRewardClaimed: false
    }
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('quanta_transactions')
    .select('source_game_key, source_mode, is_daily_reward, reward_date')
    .eq('user_id', userId)
    .eq('transaction_type', 'run_reward')
    .eq('reward_date', dateKey)

  if (error) throw error

  const transactions = Array.isArray(data) ? data : []

  return {
    // The non-daily cap is shared across Jivaro Games. Daily rewards are per game.
    rewardedRunsToday: transactions.filter((transaction) => !transaction.is_daily_reward).length,
    dailyRewardClaimed: transactions.some((transaction) => (
      transaction.source_game_key === CHRONOGAME_GAME_KEY
      && transaction.is_daily_reward
    ))
  }
}

export async function fetchQuantaOverview(userId, dateKey = getUtcDateKey()) {
  const [wallet, dayStatus] = await Promise.all([
    fetchQuantaWallet(userId),
    fetchQuantaDayStatus(userId, dateKey)
  ])

  return {
    wallet,
    ...dayStatus
  }
}
