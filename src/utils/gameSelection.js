// Game Selection | Produces unbiased unique runs and avoids an immediate repeat set
function shuffleCopy(items) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled
}

function getGameKey(game) {
  return `${game.title}::${game.year}`
}

function getSelectionSignature(games) {
  return games.map(getGameKey).sort().join('|')
}

export function selectUniqueGames(games, count, previousGames = []) {
  if (!Array.isArray(games) || !Number.isInteger(count) || count <= 0) {
    return []
  }

  const targetCount = Math.min(count, games.length)
  const canAvoidPreviousSet = games.length > targetCount && previousGames.length === targetCount
  const previousSignature = canAvoidPreviousSet ? getSelectionSignature(previousGames) : ''

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const selected = shuffleCopy(games).slice(0, targetCount)

    if (!canAvoidPreviousSet || getSelectionSignature(selected) !== previousSignature) {
      return selected
    }
  }

  const previousKeys = new Set(previousGames.map(getGameKey))
  const replacementPool = shuffleCopy(games.filter((game) => !previousKeys.has(getGameKey(game))))
  const replacement = replacementPool[0]
  const remainingPool = shuffleCopy(games.filter((game) => getGameKey(game) !== getGameKey(replacement)))

  return shuffleCopy([replacement, ...remainingPool.slice(0, targetCount - 1)])
}
