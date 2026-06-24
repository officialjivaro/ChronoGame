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

export const STORE_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'cabinet', label: 'Cabinet Skins' }),
  Object.freeze({ id: 'frames', label: 'Profile Frames' }),
  Object.freeze({ id: 'effects', label: 'Result Effects' }),
  Object.freeze({ id: 'titles', label: 'Titles & Badges' }),
  Object.freeze({ id: 'chronobot', label: 'ChronoBot Accessories' }),
  Object.freeze({ id: 'sounds', label: 'Sound Packs' })
])

export const STORE_ITEMS = Object.freeze([
  Object.freeze({ id: 'amber-reactor', category: 'cabinet', name: 'Amber Reactor', price: 40, description: 'A warm reactor glow for the cabinet shell.' }),
  Object.freeze({ id: 'midnight-vector', category: 'cabinet', name: 'Midnight Vector', price: 55, description: 'Black glass, thin grid lines, suspicious confidence.' }),
  Object.freeze({ id: 'radioactive-lime', category: 'cabinet', name: 'Radioactive Lime', price: 65, description: 'A cabinet color approved by absolutely no safety board.' }),
  Object.freeze({ id: 'deep-space-violet', category: 'cabinet', name: 'Deep-Space Violet', price: 75, description: 'A purple finish recovered from the far edge of 1999.' }),

  Object.freeze({ id: 'pixel-pilot', category: 'frames', name: 'Pixel Pilot', price: 20, description: 'A crisp pixel border for leaderboard identities.' }),
  Object.freeze({ id: 'time-archivist', category: 'frames', name: 'Time Archivist', price: 25, description: 'A brass-edged frame for serious calendar detectives.' }),
  Object.freeze({ id: 'arcade-royalty', category: 'frames', name: 'Arcade Royalty', price: 35, description: 'Gold trim with exactly the right amount of showing off.' }),
  Object.freeze({ id: 'glitch-survivor', category: 'frames', name: 'Glitch Survivor', price: 30, description: 'A fractured frame that somehow still passes inspection.' }),

  Object.freeze({ id: 'coin-burst', category: 'effects', name: 'Coin Burst', price: 30, description: 'A shower of tiny Quanta after a cleared run.' }),
  Object.freeze({ id: 'timeline-fracture', category: 'effects', name: 'Timeline Fracture', price: 45, description: 'Crack the results screen without cracking the score.' }),
  Object.freeze({ id: 'perfect-guess-nova', category: 'effects', name: 'Perfect Guess Nova', price: 50, description: 'A restrained explosion for exact-year brilliance.' }),
  Object.freeze({ id: 'crt-collapse', category: 'effects', name: 'CRT Collapse', price: 38, description: 'The screen powers down like it knows something you do not.' }),

  Object.freeze({ id: 'calendar-criminal', category: 'titles', name: 'Calendar Criminal', price: 10, description: 'For players wanted across several decades.' }),
  Object.freeze({ id: 'decade-detective', category: 'titles', name: 'Decade Detective', price: 14, description: 'A badge for identifying suspiciously specific eras.' }),
  Object.freeze({ id: 'temporal-menace', category: 'titles', name: 'Temporal Menace', price: 18, description: 'The timeline has filed a formal complaint.' }),
  Object.freeze({ id: 'certified-time-traveler', category: 'titles', name: 'Certified Time Traveler', price: 20, description: 'Certification not recognized by conventional physics.' }),

  Object.freeze({ id: 'tiny-top-hat', category: 'chronobot', name: 'Tiny Top Hat', price: 15, description: 'ChronoBot insists this improves historical accuracy.' }),
  Object.freeze({ id: 'space-helmet', category: 'chronobot', name: 'Space Helmet', price: 22, description: 'Useful for years containing unusually low oxygen.' }),
  Object.freeze({ id: 'questionable-mustache', category: 'chronobot', name: 'Questionable Mustache', price: 18, description: 'Raises charisma and several important questions.' }),
  Object.freeze({ id: 'gold-antenna', category: 'chronobot', name: 'Gold Antenna', price: 30, description: 'Receives premium signals from abandoned arcades.' }),

  Object.freeze({ id: 'eight-bit-cabinet', category: 'sounds', name: '8-Bit Cabinet', price: 50, description: 'Friendly bleeps from a less complicated century.' }),
  Object.freeze({ id: 'dreamcast-lounge', category: 'sounds', name: 'Dreamcast Lounge', price: 65, description: 'Airy menu tones and extremely optimistic technology.' }),
  Object.freeze({ id: 'haunted-cartridge', category: 'sounds', name: 'Haunted Cartridge', price: 60, description: 'Crackles, whispers, and one save file named HELP.' }),
  Object.freeze({ id: 'future-mall', category: 'sounds', name: 'Future Mall', price: 80, description: 'Soft synths from a food court that never existed.' })
])

export const CHRONOBOT_MESSAGES = Object.freeze({
  store: 'The Quantum Bazaar is still under construction. Someone misplaced 1987.',
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
