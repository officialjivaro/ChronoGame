// Cosmetic Service | Reads the ChronoGame catalog and calls secure purchase and equipment RPCs
import { requireSupabase } from '../lib/supabase.js'
import { CHRONOGAME_RPCS } from '../config/platform.js'

export async function fetchCosmeticCatalog() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('chronogame_shop_items')
    .select('item_key, category, equipment_slot, display_name, description, price, active, sort_order, created_at, updated_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function fetchCosmeticInventory(userId) {
  if (!userId) return []

  const client = requireSupabase()
  const { data, error } = await client
    .from('chronogame_user_inventory')
    .select('item_key, purchase_order_id, acquired_at')
    .eq('user_id', userId)
    .order('acquired_at', { ascending: true })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function fetchEquippedCosmetics(userId) {
  if (!userId) return []

  const client = requireSupabase()
  const { data, error } = await client
    .from('chronogame_equipped_items')
    .select('slot, item_key, updated_at')
    .eq('user_id', userId)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function purchaseCosmetic(itemKey, clientPurchaseId) {
  const client = requireSupabase()
  const { data, error } = await client.rpc(CHRONOGAME_RPCS.purchaseCosmetic, {
    p_item_key: itemKey,
    p_client_purchase_id: clientPurchaseId
  })

  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data

  return {
    purchaseOrderId: result?.purchase_order_id || null,
    itemKey: result?.item_key || itemKey,
    pricePaid: Number(result?.price_paid) || 0,
    previousBalance: Number(result?.previous_balance) || 0,
    newBalance: Number(result?.new_balance) || 0,
    inserted: result?.inserted !== false,
    owned: result?.owned !== false,
    message: result?.message || 'Purchase completed.'
  }
}

export async function setEquippedCosmetic(slot, itemKey = null) {
  const client = requireSupabase()
  const { data, error } = await client.rpc(CHRONOGAME_RPCS.setEquippedCosmetic, {
    p_slot: slot,
    p_item_key: itemKey || null
  })

  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data

  return {
    slot: result?.equipped_slot || slot,
    itemKey: result?.equipped_item_key || null,
    updatedAt: result?.equipped_updated_at || null
  }
}
