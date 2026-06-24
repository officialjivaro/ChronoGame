// Online Scores | Keeps Supabase queries out of Vue components and Vuex modules
import { requireSupabase } from '../lib/supabase.js'

const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} _.-]+$/u

export function validateDisplayName(value) {
  const displayName = String(value || '').trim().replace(/\s+/g, ' ')

  if (displayName.length < 3 || displayName.length > 24) {
    throw new Error('Display names must contain between 3 and 24 characters.')
  }

  if (!DISPLAY_NAME_PATTERN.test(displayName)) {
    throw new Error('Use letters, numbers, spaces, periods, hyphens, or underscores only.')
  }

  return displayName
}

export async function fetchProfile(userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('user_id, display_name, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateProfileDisplayName(userId, value) {
  const client = requireSupabase()
  const displayName = validateDisplayName(value)
  const { data, error } = await client
    .from('profiles')
    .update({ display_name: displayName })
    .eq('user_id', userId)
    .select('user_id, display_name, created_at, updated_at')
    .single()

  if (error) throw error
  return data
}

function normalizeScoreSubmission(result) {
  const value = result || {}

  return {
    runId: value.run_id || null,
    dailyOfficial: Boolean(value.daily_official),
    inserted: Boolean(value.inserted),
    quantaAwarded: Math.max(0, Number(value.quanta_awarded) || 0),
    previousBalance: Math.max(0, Number(value.previous_balance) || 0),
    newBalance: Math.max(0, Number(value.new_balance) || 0),
    rewardStatus: value.reward_status || 'not_cleared',
    rewardedRunsToday: Math.max(0, Number(value.rewarded_runs_today) || 0),
    dailyRewardClaimed: Boolean(value.daily_reward_claimed),
    rewardMessage: value.reward_message || ''
  }
}

export async function submitOnlineScore(payload) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('submit_score_run_v2', {
    p_client_run_id: payload.clientRunId,
    p_mode: payload.mode,
    p_score: payload.score,
    p_max_score: payload.maxScore,
    p_rounds_completed: payload.roundsCompleted,
    p_average_year_error: payload.averageYearError,
    p_best_streak: payload.bestStreak,
    p_selected_decade: payload.selectedDecade,
    p_daily_date: payload.dailyDate,
    p_round_data: payload.roundData,
    p_client_version: payload.clientVersion
  })

  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data
  return normalizeScoreSubmission(result)
}

export async function fetchLeaderboard({ modeId = 'classic', dailyDate = null, limit = 25 } = {}) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_leaderboard', {
    p_mode: modeId,
    p_daily_date: modeId === 'daily' ? dailyDate : null,
    p_limit: limit
  })

  if (error) throw error
  return Array.isArray(data) ? data : []
}
