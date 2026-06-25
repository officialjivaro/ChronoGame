// Cosmetic Store | Coordinates catalog browsing, ownership, equipment, and Bazaar UI state
import {
  COSMETIC_CATEGORIES,
  COSMETIC_SLOTS,
  DEFAULT_COSMETICS,
  FALLBACK_COSMETIC_CATALOG,
  getDefaultCosmetic,
  getLocalCosmeticItem,
  normalizeCatalog
} from '../../config/cosmetics.js'
import {
  fetchCosmeticCatalog,
  fetchCosmeticInventory,
  fetchEquippedCosmetics,
  purchaseCosmetic,
  setEquippedCosmetic
} from '../../services/cosmetics.js'

function createPurchaseId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function emptyEquipment() {
  return {
    background: null,
    ui_skin: null,
    pet: null
  }
}

function initialState() {
  return {
    initialized: false,
    catalogLoaded: false,
    catalogSource: 'none',
    catalog: [],
    inventory: [],
    equipped: emptyEquipment(),
    userId: '',
    loading: false,
    error: '',
    bazaarOpen: false,
    activeTab: 'store',
    activeCategory: COSMETIC_CATEGORIES[0].id,
    selectedItemKey: '',
    purchaseStatus: 'idle',
    purchaseMessage: '',
    purchaseRequestIds: {},
    equipStatus: 'idle',
    liveMessage: ''
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    categories() {
      return COSMETIC_CATEGORIES
    },
    catalogItems(state) {
      return state.catalog
    },
    ownedItemKeys(state) {
      return state.inventory.map((row) => row.item_key)
    },
    isOwned: (state, getters) => (itemKey) => {
      if (DEFAULT_COSMETICS.some((item) => item.itemKey === itemKey)) return true
      return getters.ownedItemKeys.includes(itemKey)
    },
    isEquipped: (state) => (item) => {
      if (!item) return false
      const equippedKey = state.equipped[item.equipmentSlot] || null
      return item.isDefault ? equippedKey === null : equippedKey === item.itemKey
    },
    inventoryItems(state, getters) {
      const ownedCatalog = state.catalog.filter((item) => getters.isOwned(item.itemKey))
      return [...DEFAULT_COSMETICS, ...ownedCatalog]
        .sort((first, second) => {
          if (first.category !== second.category) {
            return COSMETIC_SLOTS.indexOf(first.category) - COSMETIC_SLOTS.indexOf(second.category)
          }
          return first.sortOrder - second.sortOrder
        })
    },
    selectedItem(state, getters) {
      return [...state.catalog, ...getters.inventoryItems]
        .find((item) => item.itemKey === state.selectedItemKey) || null
    },
    equippedItem: (state) => (slot) => {
      const itemKey = state.equipped[slot]
      return itemKey ? getLocalCosmeticItem(itemKey) : getDefaultCosmetic(slot)
    },
    equippedBackground(state) {
      return state.equipped.background ? getLocalCosmeticItem(state.equipped.background) : null
    },
    equippedSkinId(state) {
      return state.equipped.ui_skin
        ? getLocalCosmeticItem(state.equipped.ui_skin)?.skinId || 'default'
        : 'default'
    },
    equippedPet(state) {
      return state.equipped.pet ? getLocalCosmeticItem(state.equipped.pet) : null
    },
    purchasing(state) {
      return state.purchaseStatus === 'purchasing'
    },
    equipping(state) {
      return state.equipStatus === 'equipping'
    },
    purchasesAvailable(state, _getters, rootState) {
      return state.catalogSource === 'server' && Boolean(rootState.online?.user?.id)
    }
  },
  mutations: {
    setInitialized(state, value) {
      state.initialized = Boolean(value)
    },
    setCatalogLoaded(state, value) {
      state.catalogLoaded = Boolean(value)
    },
    setCatalog(state, payload) {
      state.catalog = Array.isArray(payload?.items) ? payload.items : []
      state.catalogSource = payload?.source || 'none'
      state.catalogLoaded = true
    },
    setInventory(state, rows) {
      state.inventory = Array.isArray(rows) ? rows : []
    },
    addInventoryItem(state, payload) {
      if (!payload?.item_key) return
      const existingIndex = state.inventory.findIndex((row) => row.item_key === payload.item_key)

      if (existingIndex >= 0) {
        state.inventory.splice(existingIndex, 1, { ...state.inventory[existingIndex], ...payload })
      } else {
        state.inventory.push(payload)
      }
    },
    setEquipped(state, rows) {
      const equipment = emptyEquipment()
      ;(Array.isArray(rows) ? rows : []).forEach((row) => {
        if (COSMETIC_SLOTS.includes(row?.slot)) equipment[row.slot] = row.item_key || null
      })
      state.equipped = equipment
    },
    setEquippedSlot(state, payload) {
      if (!COSMETIC_SLOTS.includes(payload?.slot)) return
      state.equipped = {
        ...state.equipped,
        [payload.slot]: payload.itemKey || null
      }
    },
    setUserId(state, userId) {
      state.userId = userId || ''
    },
    setLoading(state, value) {
      state.loading = Boolean(value)
    },
    setError(state, value) {
      state.error = value || ''
    },
    setBazaarOpen(state, value) {
      state.bazaarOpen = Boolean(value)
    },
    setActiveTab(state, value) {
      state.activeTab = value === 'inventory' ? 'inventory' : 'store'
    },
    setActiveCategory(state, value) {
      if (COSMETIC_SLOTS.includes(value)) state.activeCategory = value
    },
    setSelectedItemKey(state, value) {
      state.selectedItemKey = value || ''
    },
    setPurchaseState(state, payload) {
      state.purchaseStatus = payload?.status || 'idle'
      state.purchaseMessage = payload?.message || ''
    },
    setPurchaseRequestId(state, payload) {
      if (!payload?.itemKey) return
      state.purchaseRequestIds = {
        ...state.purchaseRequestIds,
        [payload.itemKey]: payload.requestId || ''
      }
    },
    clearPurchaseRequestId(state, itemKey) {
      if (!itemKey || !state.purchaseRequestIds[itemKey]) return
      const nextIds = { ...state.purchaseRequestIds }
      delete nextIds[itemKey]
      state.purchaseRequestIds = nextIds
    },
    setEquipState(state, payload) {
      state.equipStatus = payload?.status || 'idle'
      if (payload?.message !== undefined) state.liveMessage = payload.message || ''
    },
    setLiveMessage(state, value) {
      state.liveMessage = value || ''
    },
    clearPrivateState(state) {
      state.inventory = []
      state.equipped = emptyEquipment()
      state.loading = false
      state.error = ''
      state.userId = ''
      state.purchaseStatus = 'idle'
      state.purchaseMessage = ''
      state.purchaseRequestIds = {}
      state.equipStatus = 'idle'
      state.liveMessage = ''
    }
  },
  actions: {
    async initialize({ state, rootState, dispatch, commit }) {
      if (state.initialized) return

      await dispatch('loadCatalog')
      await dispatch('handleAuthState', rootState.online?.user || null)
      commit('setInitialized', true)
    },
    async loadCatalog({ state, commit }) {
      if (state.catalogLoaded) return state.catalog

      commit('setLoading', true)
      commit('setError', '')

      try {
        const rows = await fetchCosmeticCatalog()
        const items = normalizeCatalog(rows)

        if (!items.length) throw new Error('The ChronoGame cosmetic catalog is empty.')

        commit('setCatalog', { items, source: 'server' })
        return items
      } catch {
        commit('setCatalog', { items: FALLBACK_COSMETIC_CATALOG, source: 'fallback' })
        commit('setError', 'The live Bazaar catalog is unavailable. Preview mode is active and purchases are disabled.')
        return FALLBACK_COSMETIC_CATALOG
      } finally {
        commit('setLoading', false)
      }
    },
    async handleAuthState({ state, dispatch, commit }, user) {
      if (!user?.id) {
        commit('clearPrivateState')
        return null
      }

      if (state.userId && state.userId !== user.id) {
        commit('clearPrivateState')
      }

      commit('setUserId', user.id)
      return dispatch('loadAccountCosmetics', user.id)
    },
    async loadAccountCosmetics({ state, commit }, userId = state.userId) {
      if (!userId) return null

      commit('setLoading', true)
      commit('setError', '')

      try {
        const [inventory, equipped] = await Promise.all([
          fetchCosmeticInventory(userId),
          fetchEquippedCosmetics(userId)
        ])
        if (state.userId !== userId) return null

        commit('setInventory', inventory)
        commit('setEquipped', equipped)
        return { inventory, equipped }
      } catch (error) {
        if (state.userId === userId) {
          commit('setError', error.message || 'Your ChronoGame inventory could not be loaded.')
        }
        return null
      } finally {
        if (state.userId === userId) commit('setLoading', false)
      }
    },
    openBazaar({ state, getters, commit }, payload = {}) {
      const tab = payload?.tab === 'inventory' ? 'inventory' : 'store'
      const category = COSMETIC_SLOTS.includes(payload?.category)
        ? payload.category
        : state.activeCategory

      commit('setActiveTab', tab)
      commit('setActiveCategory', category)

      const candidates = tab === 'inventory' ? getters.inventoryItems : state.catalog
      const selectedExists = candidates.some((item) => item.itemKey === state.selectedItemKey && item.category === category)
      if (!selectedExists) {
        commit('setSelectedItemKey', candidates.find((item) => item.category === category)?.itemKey || '')
      }

      if (state.purchaseStatus !== 'purchasing') {
        commit('setPurchaseState', { status: 'idle', message: '' })
      }
      if (state.equipStatus !== 'equipping') {
        commit('setEquipState', { status: 'idle', message: '' })
      }
      commit('setBazaarOpen', true)
    },
    closeBazaar({ state, commit }) {
      commit('setBazaarOpen', false)
      if (state.purchaseStatus !== 'purchasing') {
        commit('setPurchaseState', { status: 'idle', message: '' })
      }
      if (state.equipStatus !== 'equipping') {
        commit('setEquipState', { status: 'idle' })
      }
    },
    selectItem({ state, commit }, itemKey) {
      if (state.purchaseStatus === 'purchasing' || state.equipStatus === 'equipping') return
      commit('setSelectedItemKey', itemKey)
      commit('setPurchaseState', { status: 'idle', message: '' })
      commit('setEquipState', { status: 'idle' })
      commit('setLiveMessage', '')
    },
    changeTab({ state, getters, commit }, tab) {
      if (state.purchaseStatus === 'purchasing' || state.equipStatus === 'equipping') return
      commit('setActiveTab', tab)
      const items = tab === 'inventory' ? getters.inventoryItems : state.catalog
      commit('setSelectedItemKey', items.find((item) => item.category === state.activeCategory)?.itemKey || '')
      commit('setPurchaseState', { status: 'idle', message: '' })
      commit('setLiveMessage', '')
    },
    changeCategory({ state, getters, commit }, category) {
      if (state.purchaseStatus === 'purchasing' || state.equipStatus === 'equipping') return
      commit('setActiveCategory', category)
      const items = state.activeTab === 'inventory' ? getters.inventoryItems : state.catalog
      commit('setSelectedItemKey', items.find((item) => item.category === category)?.itemKey || '')
      commit('setPurchaseState', { status: 'idle', message: '' })
      commit('setEquipState', { status: 'idle' })
      commit('setLiveMessage', '')
    },
    async purchaseItem({ state, getters, rootState, dispatch, commit }, itemKey) {
      if (state.purchaseStatus === 'purchasing' || state.equipStatus === 'equipping') return null

      const user = rootState.online?.user
      const item = state.catalog.find((catalogItem) => catalogItem.itemKey === itemKey)

      if (!user?.id) {
        commit('setBazaarOpen', false)
        commit('online/setAuthModalOpen', true, { root: true })
        commit('setPurchaseState', {
          status: 'signin_required',
          message: 'Sign in to your Jivaro Games account before spending Quanta.'
        })
        return null
      }

      if (state.catalogSource !== 'server') {
        commit('setPurchaseState', {
          status: 'unavailable',
          message: 'Purchases are disabled until the live Bazaar catalog reconnects.'
        })
        return null
      }

      if (!item || item.isDefault) return null

      if (getters.isOwned(itemKey)) {
        commit('setPurchaseState', { status: 'owned', message: 'This item is already in your inventory.' })
        return null
      }

      const userId = user.id
      const requestId = state.purchaseRequestIds[itemKey] || createPurchaseId()
      commit('setPurchaseRequestId', { itemKey, requestId })
      commit('setPurchaseState', { status: 'purchasing', message: 'ChronoBot is verifying the ledger…' })
      commit('setError', '')

      try {
        const result = await purchaseCosmetic(itemKey, requestId)
        if (rootState.online?.user?.id !== userId) {
          commit('clearPurchaseRequestId', itemKey)
          return result
        }

        commit('clearPurchaseRequestId', itemKey)
        commit('addInventoryItem', {
          item_key: result.itemKey,
          purchase_order_id: result.purchaseOrderId,
          acquired_at: new Date().toISOString()
        })
        await dispatch('economy/applyPurchaseResult', result, { root: true })
        commit('setPurchaseState', {
          status: result.inserted ? 'purchased' : 'owned',
          message: result.message || `${item.displayName} added to your inventory.`
        })
        commit('setLiveMessage', `${item.displayName} is now in your inventory.`)
        return result
      } catch (error) {
        if (rootState.online?.user?.id === userId) {
          const message = error.message || 'The cosmetic purchase could not be completed.'
          commit('setPurchaseState', {
            status: /enough quanta|insufficient/i.test(message) ? 'insufficient' : 'error',
            message
          })
        }
        return null
      }
    },
    async equipItem({ state, getters, rootState, commit }, item) {
      if (state.purchaseStatus === 'purchasing' || state.equipStatus === 'equipping') return null

      const userId = rootState.online?.user?.id
      if (!userId) {
        commit('online/setAuthModalOpen', true, { root: true })
        commit('setEquipState', { status: 'error', message: 'Sign in before changing equipped cosmetics.' })
        return null
      }

      if (!item?.equipmentSlot) return null

      if (!item.isDefault && !getters.isOwned(item.itemKey)) {
        commit('setEquipState', { status: 'error', message: 'Purchase this item before equipping it.' })
        return null
      }

      commit('setEquipState', { status: 'equipping', message: '' })
      commit('setError', '')

      try {
        const result = await setEquippedCosmetic(item.equipmentSlot, item.isDefault ? null : item.itemKey)
        if (rootState.online?.user?.id !== userId) return result

        commit('setEquippedSlot', { slot: result.slot, itemKey: result.itemKey })
        commit('setEquipState', {
          status: 'equipped',
          message: item.isDefault
            ? `${item.displayName} restored.`
            : `${item.displayName} equipped.`
        })
        return result
      } catch (error) {
        if (rootState.online?.user?.id === userId) {
          commit('setEquipState', {
            status: 'error',
            message: error.message || 'The cosmetic could not be equipped.'
          })
        }
        return null
      }
    }
  }
}
