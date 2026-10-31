// ---------------------------------------------------------------------------
// queryCache.js — Simple in-memory query cache with TTL
// Supports stale-while-revalidate pattern for improved UX
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 60 * 1000 // 1 minute

const cache = new Map()

/**
 * Get a cached value.
 * @param {string} key
 * @returns {{ data: any, timestamp: number } | null}
 */
export function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  return entry
}

/**
 * Check if a cache entry is still fresh (not expired).
 * @param {string} key
 * @param {number} [ttlMs=60000]
 * @returns {boolean}
 */
export function isCacheFresh(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = cache.get(key)
  if (!entry) return false
  return Date.now() - entry.timestamp < ttlMs
}

/**
 * Store a value in the cache.
 * @param {string} key
 * @param {any} data
 */
export function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Invalidate a specific cache entry.
 * @param {string} key
 */
export function invalidateCache(key) {
  cache.delete(key)
}

/**
 * Invalidate all cache entries matching a prefix.
 * @param {string} prefix
 */
export function invalidateCacheByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Clear all cached entries.
 */
export function clearAllCache() {
  cache.clear()
}

export default {
  get: getCached,
  isFresh: isCacheFresh,
  set: setCache,
  invalidate: invalidateCache,
  invalidatePrefix: invalidateCacheByPrefix,
  clear: clearAllCache,
}
