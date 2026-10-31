import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: item.image_url || item.image || '/guns/pistol.svg',
    image: item.image_url || item.image || '/guns/pistol.svg',
    ingredients: specsList,
    steps: stepsList,
    // Soft delete fields
    is_archived: item.is_archived || false,
    archived_at: item.archived_at || null,
  }
}

// ---------------------------------------------------------------------------
// ARCHIVE KEY — localStorage key for archived items (soft delete fallback)
// ---------------------------------------------------------------------------
const ARCHIVE_KEY = 'bore_barrel_archived_ids'

function getArchivedIds() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setArchivedIds(ids) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   * @param {Object} params - query params
   * @param {boolean} [params.include_archived=false] - include archived items
   */
  async getGuns(params = {}) {
    const { include_archived = false, ...queryParams } = params
    const archivedIds = getArchivedIds()

    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      if (queryParams.search) {
        queryParts.push(`name=ilike.*${encodeURIComponent(queryParams.search)}*`)
      }

      if (queryParams.category && queryParams.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(queryParams.category)}`)
      }

      if (queryParams.sort_by) {
        const order = queryParams.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${encodeURIComponent(queryParams.sort_by)}.${order}`)
      } else {
        queryParts.push('order=created_at.desc')
      }

      if (queryParams.limit) {
        queryParts.push(`limit=${queryParams.limit}`)
      }

      const queryString = queryParts.join('&')
      const data = await apiClient.get(`/rest/v1/products?${queryString}`)
      let list = Array.isArray(data) ? data.map(normalizeProduct) : []

      // Apply local soft-delete filter
      if (!include_archived) {
        list = list.filter((g) => !archivedIds.includes(String(g.id)))
      } else {
        // Return only archived
        list = list.filter((g) => archivedIds.includes(String(g.id)))
      }

      return {
        success: true,
        data: list,
        pagination: {
          total: list.length,
          page: queryParams.page || 1,
          limit: queryParams.limit || 50,
        },
      }
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v !== '' && v != null),
    )
    const result = await apiClient.get('/api/v1/recipes', { params: clean })

    if (result && result.success && Array.isArray(result.data)) {
      let list = result.data
      if (!include_archived) {
        list = list.filter((g) => !archivedIds.includes(String(g.id)))
      } else {
        list = list.filter((g) => archivedIds.includes(String(g.id)))
      }
      return { ...result, data: list }
    }

    return result
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data: normalizeProduct(data[0]) }
      }
      throw new Error('Hardware item not found.')
    }
    return apiClient.get(`/api/v1/recipes/${id}`)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: data.image_url || null,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(created) }
    }
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.image_url !== undefined) payload.image_url = data.image_url

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(updated) }
    }
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Soft delete (archive) a product — stores in localStorage.
   * The item remains in the backend but is hidden from normal listings.
   * @param {string|number} id
   */
  archiveGun(id) {
    const ids = getArchivedIds()
    const strId = String(id)
    if (!ids.includes(strId)) {
      ids.push(strId)
      setArchivedIds(ids)
    }
    return { success: true }
  }

  /**
   * Restore an archived product (undo soft delete).
   * @param {string|number} id
   */
  restoreGun(id) {
    const ids = getArchivedIds().filter((x) => x !== String(id))
    setArchivedIds(ids)
    return { success: true }
  }

  /**
   * Check if a product is archived.
   * @param {string|number} id
   * @returns {boolean}
   */
  isArchived(id) {
    return getArchivedIds().includes(String(id))
  }

  /**
   * Hard delete product.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      // Also remove from archived list if present
      this.restoreGun(id)
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
