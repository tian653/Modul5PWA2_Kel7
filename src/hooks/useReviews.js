import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import queryCache from '../utils/queryCache'

const REVIEW_CACHE_TTL = 30 * 1000 // 30 seconds

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product, with caching.
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = `reviews:${gunId}`

  const fetchReviews = useCallback(async (force = false) => {
    if (!gunId) {
      setLoading(false)
      return
    }

    const cached = queryCache.get(cacheKey)
    if (cached && queryCache.isFresh(cacheKey, REVIEW_CACHE_TTL) && !force) {
      setReviews(cached.data || [])
      setLoading(false)
      setError(null)
      return
    }

    if (cached) setReviews(cached.data || [])

    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.getReviews(gunId)

      if (response.success) {
        queryCache.set(cacheKey, response.data || [])
        setReviews(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch reviews.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      if (!cached) setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId, cacheKey])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const refetch = useCallback(() => fetchReviews(true), [fetchReviews])

  return { reviews, loading, error, refetch }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response.success) {
        setSuccess(true)
        // Invalidate review cache so next fetch is fresh
        queryCache.invalidate(`reviews:${gunId}`)
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}

// ---------------------------------------------------------------------------
// useUpdateReview — edit an existing review.
// ---------------------------------------------------------------------------

export function useUpdateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateReview = async (reviewId, reviewData, gunId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.updateReview(reviewId, reviewData)

      if (response.success) {
        if (gunId) queryCache.invalidate(`reviews:${gunId}`)
        return response.data
      } else {
        setError(response.message || 'Failed to update review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'Failed to update review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { updateReview, loading, error }
}

// ---------------------------------------------------------------------------
// useDeleteReview — delete an existing review.
// ---------------------------------------------------------------------------

export function useDeleteReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteReview = async (reviewId, gunId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.deleteReview(reviewId)

      if (response.success) {
        if (gunId) queryCache.invalidate(`reviews:${gunId}`)
        return true
      } else {
        setError(response.message || 'Failed to delete review.')
        return false
      }
    } catch (err) {
      setError(err.message || 'Failed to delete review.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deleteReview, loading, error }
}
