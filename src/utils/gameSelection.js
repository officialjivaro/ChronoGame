// Game Selection | Produces an unbiased set of unique games
export function selectUniqueGames(games, count) {
  if (!Array.isArray(games)) {
    return []
  }

  const shuffled = [...games]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled.slice(0, Math.min(count, shuffled.length))
}
