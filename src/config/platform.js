// Jivaro Games Platform | Shared account branding and ChronoGame backend identifiers
export const JIVARO_GAMES_NAME = 'Jivaro Games'
export const JIVARO_GAMES_PLATFORM_KEY = 'jivaro_games'
export const JIVARO_GAMES_AUTH_STORAGE_KEY = 'jivaro-games-supabase-auth'
export const JIVARO_GAMES_LEGACY_AUTH_STORAGE_KEYS = Object.freeze([
  'chronogame-supabase-auth'
])

export const CHRONOGAME_GAME_KEY = 'chronogame'

export const CHRONOGAME_RPCS = Object.freeze({
  submitScoreRun: 'chronogame_submit_score_run_v2',
  getLeaderboard: 'chronogame_get_leaderboard',
  purchaseCosmetic: 'chronogame_purchase_item',
  setEquippedCosmetic: 'chronogame_set_equipped_item'
})
