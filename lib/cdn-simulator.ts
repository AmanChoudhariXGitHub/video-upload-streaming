// Simulated CDN functionality

interface CacheEntry {
  path: string
  data: Buffer
  contentType: string
  cachedAt: Date
  hits: number
}

class CDNSimulator {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly maxCacheSize = 100 // Max cached items
  private readonly cacheDuration = 24 * 60 * 60 * 1000 // 24 hours

  // Cache a file
  async cache(path: string, data: Buffer, contentType: string): Promise<void> {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest()
    }

    this.cache.set(path, {
      path,
      data,
      contentType,
      cachedAt: new Date(),
      hits: 0,
    })
  }

  // Get cached file
  async get(path: string): Promise<{ data: Buffer; contentType: string } | null> {
    const entry = this.cache.get(path)

    if (!entry) {
      return null
    }

    // Check if expired
    const now = Date.now()
    if (now - entry.cachedAt.getTime() > this.cacheDuration) {
      this.cache.delete(path)
      return null
    }

    // Increment hit counter
    entry.hits++

    return {
      data: entry.data,
      contentType: entry.contentType,
    }
  }

  // Invalidate cache for a path
  async invalidate(path: string): Promise<void> {
    this.cache.delete(path)
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.values()).map((entry) => ({
        path: entry.path,
        hits: entry.hits,
        cachedAt: entry.cachedAt,
      })),
    }
  }

  // Evict oldest entry
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.cachedAt.getTime() < oldestTime) {
        oldestTime = entry.cachedAt.getTime()
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Singleton instance
const cdn = new CDNSimulator()

export default cdn
