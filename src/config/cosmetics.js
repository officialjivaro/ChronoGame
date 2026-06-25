// Cosmetic Catalog | Maps server item keys to bundled ChronoGame artwork and UI behavior
export const COSMETIC_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'background', label: 'Backgrounds', slot: 'background' }),
  Object.freeze({ id: 'ui_skin', label: 'UI Skins', slot: 'ui_skin' }),
  Object.freeze({ id: 'pet', label: 'Pets', slot: 'pet' })
])

export const COSMETIC_SLOTS = Object.freeze(['background', 'ui_skin', 'pet'])

export const DEFAULT_COSMETICS = Object.freeze([
  Object.freeze({
    itemKey: 'default_background',
    category: 'background',
    equipmentSlot: 'background',
    displayName: 'Default Chrono Grid',
    description: 'The original ChronoGame cabinet backdrop.',
    price: 0,
    active: true,
    sortOrder: 0,
    isDefault: true,
    imageUrl: '',
    previewUrl: ''
  }),
  Object.freeze({
    itemKey: 'default_ui_skin',
    category: 'ui_skin',
    equipmentSlot: 'ui_skin',
    displayName: 'Classic Orange',
    description: 'The original ChronoGame panel and accent treatment.',
    price: 0,
    active: true,
    sortOrder: 0,
    isDefault: true,
    skinId: 'default',
    imageUrl: '',
    previewUrl: ''
  }),
  Object.freeze({
    itemKey: 'no_pet',
    category: 'pet',
    equipmentSlot: 'pet',
    displayName: 'No Pet',
    description: 'Keep the cabinet clear of temporal companions.',
    price: 0,
    active: true,
    sortOrder: 0,
    isDefault: true,
    imageUrl: '',
    previewUrl: ''
  })
])

const LOCAL_ITEMS = Object.freeze({
  amber_terminal: Object.freeze({
    itemKey: 'amber_terminal',
    category: 'background',
    equipmentSlot: 'background',
    displayName: 'Amber Terminal',
    description: 'A sunset terminal city framed by an amber vector grid.',
    price: 20,
    sortOrder: 10,
    imageUrl: new URL('../assets/cosmetics/backgrounds/amber-terminal.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/backgrounds/amber-terminal.webp', import.meta.url).href
  }),
  midnight_vector: Object.freeze({
    itemKey: 'midnight_vector',
    category: 'background',
    equipmentSlot: 'background',
    displayName: 'Midnight Vector',
    description: 'Cold cyan geometry across a silent midnight horizon.',
    price: 28,
    sortOrder: 20,
    imageUrl: new URL('../assets/cosmetics/backgrounds/midnight-vector.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/backgrounds/midnight-vector.webp', import.meta.url).href
  }),
  violet_timegrid: Object.freeze({
    itemKey: 'violet_timegrid',
    category: 'background',
    equipmentSlot: 'background',
    displayName: 'Violet Timegrid',
    description: 'A luminous temporal gate suspended above a violet grid.',
    price: 34,
    sortOrder: 30,
    imageUrl: new URL('../assets/cosmetics/backgrounds/violet-timegrid.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/backgrounds/violet-timegrid.webp', import.meta.url).href
  }),
  neon_archive: Object.freeze({
    itemKey: 'neon_archive',
    category: 'background',
    equipmentSlot: 'background',
    displayName: 'Neon Archive',
    description: 'A multicolor data vault recovered from a forgotten arcade.',
    price: 40,
    sortOrder: 40,
    imageUrl: new URL('../assets/cosmetics/backgrounds/neon-archive.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/backgrounds/neon-archive.webp', import.meta.url).href
  }),
  amber_reactor: Object.freeze({
    itemKey: 'amber_reactor',
    category: 'ui_skin',
    equipmentSlot: 'ui_skin',
    displayName: 'Amber Reactor',
    description: 'Deep bronze panels with bright reactor-orange controls.',
    price: 30,
    sortOrder: 50,
    skinId: 'amber-reactor',
    imageUrl: new URL('../assets/cosmetics/skins/amber-reactor-preview.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/skins/amber-reactor-preview.webp', import.meta.url).href
  }),
  phosphor_grid: Object.freeze({
    itemKey: 'phosphor_grid',
    category: 'ui_skin',
    equipmentSlot: 'ui_skin',
    displayName: 'Phosphor Grid',
    description: 'Green terminal phosphor with crisp archival grid lines.',
    price: 40,
    sortOrder: 60,
    skinId: 'phosphor-grid',
    imageUrl: new URL('../assets/cosmetics/skins/phosphor-grid-preview.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/skins/phosphor-grid-preview.webp', import.meta.url).href
  }),
  violet_vector: Object.freeze({
    itemKey: 'violet_vector',
    category: 'ui_skin',
    equipmentSlot: 'ui_skin',
    displayName: 'Violet Vector',
    description: 'Violet glass, cyan highlights, and sharp vector framing.',
    price: 50,
    sortOrder: 70,
    skinId: 'violet-vector',
    imageUrl: new URL('../assets/cosmetics/skins/violet-vector-preview.webp', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/skins/violet-vector-preview.webp', import.meta.url).href
  }),
  byte_cat: Object.freeze({
    itemKey: 'byte_cat',
    category: 'pet',
    equipmentSlot: 'pet',
    displayName: 'Byte Cat',
    description: 'A curious cyber-cat with bright scanner eyes.',
    price: 50,
    sortOrder: 80,
    imageUrl: new URL('../assets/cosmetics/pets/byte-cat-sprite.png', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/pets/byte-cat-sprite.png', import.meta.url).href,
    spriteColumns: 4
  }),
  pixel_pup: Object.freeze({
    itemKey: 'pixel_pup',
    category: 'pet',
    equipmentSlot: 'pet',
    displayName: 'Pixel Pup',
    description: 'An eager arcade pup with a permanently optimistic tail.',
    price: 60,
    sortOrder: 90,
    imageUrl: new URL('../assets/cosmetics/pets/pixel-pup-sprite.png', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/pets/pixel-pup-sprite.png', import.meta.url).href,
    spriteColumns: 4
  }),
  clockwork_owl: Object.freeze({
    itemKey: 'clockwork_owl',
    category: 'pet',
    equipmentSlot: 'pet',
    displayName: 'Clockwork Owl',
    description: 'A watchful brass-clock owl calibrated to UTC.',
    price: 70,
    sortOrder: 100,
    imageUrl: new URL('../assets/cosmetics/pets/clockwork-owl-sprite.png', import.meta.url).href,
    previewUrl: new URL('../assets/cosmetics/pets/clockwork-owl-sprite.png', import.meta.url).href,
    spriteColumns: 4
  })
})

export const FALLBACK_COSMETIC_CATALOG = Object.freeze(
  Object.values(LOCAL_ITEMS).map((item) => Object.freeze({ ...item, active: true }))
)

export function getLocalCosmeticItem(itemKey) {
  return LOCAL_ITEMS[itemKey] || null
}

export function getDefaultCosmetic(slot) {
  return DEFAULT_COSMETICS.find((item) => item.equipmentSlot === slot) || null
}

export function hydrateCosmeticItem(serverItem) {
  const itemKey = String(serverItem?.item_key || serverItem?.itemKey || '').trim()
  const localItem = getLocalCosmeticItem(itemKey)

  if (!localItem) return null

  return {
    ...localItem,
    itemKey,
    category: serverItem?.category || localItem.category,
    equipmentSlot: serverItem?.equipment_slot || serverItem?.equipmentSlot || localItem.equipmentSlot,
    displayName: serverItem?.display_name || serverItem?.displayName || localItem.displayName,
    description: serverItem?.description || localItem.description,
    price: Math.max(0, Number(serverItem?.price ?? localItem.price) || 0),
    active: serverItem?.active !== false,
    sortOrder: Number(serverItem?.sort_order ?? serverItem?.sortOrder ?? localItem.sortOrder) || 0,
    createdAt: serverItem?.created_at || null,
    updatedAt: serverItem?.updated_at || null
  }
}

export function normalizeCatalog(items) {
  return (Array.isArray(items) ? items : [])
    .map(hydrateCosmeticItem)
    .filter(Boolean)
    .sort((first, second) => first.sortOrder - second.sortOrder)
}
