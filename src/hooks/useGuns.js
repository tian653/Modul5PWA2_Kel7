import { useState, useEffect, useCallback, useRef } from 'react'
import gunService from '../services/gunService'
import queryCache from '../utils/queryCache'

const CACHE_TTL = 60 * 1000 // 1 minute

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
// Now with query caching: returns stale data immediately while revalidating.
//
// Returns { guns, loading, error, pagination, refetch }.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns:${paramKey}`

  const fetchGuns = useCallback(async (force = false) => {
    // Check cache first (stale-while-revalidate)
    const cached = queryCache.get(cacheKey)
    if (cached && queryCache.isFresh(cacheKey, CACHE_TTL) && !force) {
      setGuns(cached.data.guns || [])
      setPagination(cached.data.pagination || null)
      setLoading(false)
      setError(null)
      return
    }

    // Show stale data while fetching
    if (cached) {
      setGuns(cached.data.guns || [])
      setPagination(cached.data.pagination || null)
    }

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGuns(params)

      if (response.success) {
        const newData = { guns: response.data || [], pagination: response.pagination || null }
        queryCache.set(cacheKey, newData)
        setGuns(newData.guns)
        setPagination(newData.pagination)
      } else {
        setError(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      if (!cached) setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, cacheKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  const refetch = useCallback(() => fetchGuns(true), [fetchGuns])

  return { guns, loading, error, pagination, refetch }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID, with caching.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = `gun:${id}`

  const fetchGun = useCallback(async (force = false) => {
    if (!id) {
      setLoading(false)
      return
    }

    const cached = queryCache.get(cacheKey)
    if (cached && queryCache.isFresh(cacheKey, CACHE_TTL) && !force) {
      setGun(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    if (cached) setGun(cached.data)

    try {
      setLoading(true)
      setError(null)

      const response = await gunService.getGunById(id)

      if (response.success) {
        queryCache.set(cacheKey, response.data)
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      if (!cached) setGun(null)
    } finally {
      setLoading(false)
    }
  }, [id, cacheKey])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  const refetch = useCallback(() => fetchGun(true), [fetchGun])

  return { gun, loading, error, refetch }
}

// ---------------------------------------------------------------------------
// useIntersectionObserver — helper hook for lazy loading
// ---------------------------------------------------------------------------

export function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, rootMargin: '100px', ...options })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
