// Quanta Economy | Shared frontend labels, preview items, and guest reward rules
export const QUANTA_CURRENCY = Object.freeze({
  name: 'Quanta',
  symbol: 'Q'
})

export const NON_DAILY_REWARD_CAP = 10

export const MODE_QUANTA_REWARDS = Object.freeze({
  classic: 1,
  timeAttack: 2,
  survival: 3,
  decade: 2,
  daily: 4
})

export const CHRONOBOT_MESSAGES = Object.freeze({
  store: 'Quantum Bazaar online. ChronoBot accepts Quanta and suspiciously exact change.',
  guest: 'Guest Quanta survive this tab, but not the next temporal departure.',
  signedIn: 'Permanent Quanta secured. ChronoBot has counted them twice.',
  rewarded: 'Timeline stabilized. Payment approved with minimal robot paperwork.',
  notCleared: 'No Quanta for unfinished timelines. ChronoBot saw everything.',
  capReached: 'Reward limit reached. The Quanta dispenser needs a UTC nap.',
  dailyPaid: 'Today’s anomaly already paid out. Practice remains suspiciously free.',
  saveFailed: 'The wallet signal vanished. Retry before the timeline notices.'
})

export function getModeQuantaReward(modeId) {
  return Number(MODE_QUANTA_REWARDS[modeId] || 0)
}

export function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function countLifeLosses(roundData) {
  return (Array.isArray(roundData) ? roundData : [])
    .filter((round) => Boolean(round?.life_lost ?? round?.lifeLost))
    .length
}

export function isRunCleared(payload) {
  const mode = payload?.mode
  const roundsCompleted = Number(payload?.roundsCompleted || 0)
  const roundData = Array.isArray(payload?.roundData) ? payload.roundData : []

  if (mode === 'classic' || mode === 'decade' || mode === 'daily') {
    return roundsCompleted === 10 && roundData.length === 10
  }

  if (mode === 'timeAttack') {
    return roundsCompleted >= 5 && roundData.length >= 5
  }

  if (mode === 'survival') {
    return roundsCompleted === 10 && roundData.length === 10 && countLifeLosses(roundData) < 3
  }

  return false
}

export function getQuantaRewardMessage(status, modeId, amount = 0) {
  if (status === 'rewarded' || status === 'guest_rewarded') {
    const modeMessages = {
      classic: 'Timeline stabilized. One Quanta recovered.',
      timeAttack: 'Clock survived. Two Quanta escaped the countdown.',
      survival: 'All ten rounds survived. Three Quanta escaped the void.',
      decade: 'Decade archived. Two Quanta catalogued.',
      daily: 'Today’s anomaly contained. Four Quanta secured.'
    }

    return modeMessages[modeId] || `${amount} Quanta recovered from the timeline.`
  }

  if (status === 'already_rewarded') return 'This timeline already paid out. Balance unchanged.'
  if (status === 'daily_already_paid') return 'Practice run complete. The timeline already paid today.'
  if (status === 'daily_cap_reached') return 'Reward limit reached. Ten rewarded runs completed today.'
  if (status === 'not_cleared') return 'Run incomplete. ChronoBot refuses to pay unfinished timelines.'
  if (status === 'save_failed') return 'Wallet update failed. Retry the same run to recover its reward.'
  if (status === 'duplicate') return 'This timeline was already processed. No duplicate Quanta created.'

  return 'No Quanta were awarded for this run.'
}
