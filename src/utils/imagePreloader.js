// Image Preloading | Warms the browser cache for upcoming rounds
export function preloadImage(url) {
  if (!url || typeof Image === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })
}

export async function preloadGames(games, limit = 1) {
  const targets = Array.isArray(games) ? games.slice(0, limit) : []
  return Promise.all(targets.map((game) => preloadImage(game?.imageUrl)))
}
