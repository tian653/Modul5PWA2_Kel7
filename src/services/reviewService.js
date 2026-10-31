import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// Thumbs up/down stored locally.
// ---------------------------------------------------------------------------

const THUMBS_KEY = 'bore_barrel_review_thumbs'

function getThumbsData() {
  try {
    const raw = localStorage.getItem(THUMBS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveThumbsData(data) {
  try {
    localStorage.setItem(THUMBS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    const thumbsData = getThumbsData()

    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
      )
      const list = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
            thumbs_up: thumbsData[r.id]?.up || 0,
            thumbs_down: thumbsData[r.id]?.down || 0,
            user_thumb: thumbsData[r.id]?.user_thumb || null, // 'up' | 'down' | null
          }))
        : []

      return { success: true, data: list }
    }

    const result = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
    if (result && result.success && Array.isArray(result.data)) {
      const enriched = result.data.map((r) => ({
        ...r,
        thumbs_up: thumbsData[r.id]?.up || 0,
        thumbs_down: thumbsData[r.id]?.down || 0,
        user_thumb: thumbsData[r.id]?.user_thumb || null,
      }))
      return { ...result, data: enriched }
    }
    return result
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }

  /**
   * Toggle thumbs up or down for a review (local only).
   * @param {string|number} reviewId
   * @param {'up'|'down'} direction
   * @returns {{ thumbs_up: number, thumbs_down: number, user_thumb: string|null }}
   */
  toggleThumb(reviewId, direction) {
    const thumbs = getThumbsData()
    const current = thumbs[reviewId] || { up: 0, down: 0, user_thumb: null }

    if (current.user_thumb === direction) {
      // Undo thumb
      const updated = {
        up: direction === 'up' ? Math.max(0, current.up - 1) : current.up,
        down: direction === 'down' ? Math.max(0, current.down - 1) : current.down,
        user_thumb: null,
      }
      thumbs[reviewId] = updated
      saveThumbsData(thumbs)
      return updated
    }

    // Switch or set thumb
    const updated = {
      up: direction === 'up' ? current.up + 1 : (current.user_thumb === 'up' ? Math.max(0, current.up - 1) : current.up),
      down: direction === 'down' ? current.down + 1 : (current.user_thumb === 'down' ? Math.max(0, current.down - 1) : current.down),
      user_thumb: direction,
    }
    thumbs[reviewId] = updated
    saveThumbsData(thumbs)
    return updated
  }
}

export default new ReviewService()
