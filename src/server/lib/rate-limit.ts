/**
 * Rate limiting utilities for protecting expensive endpoints
 *
 * Uses Upstash Redis for distributed rate limiting
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client (only if configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

/**
 * In-memory fallback rate limiter (when Redis unavailable)
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map()

  async check(key: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this key
    const existing = this.requests.get(key) || []

    // Filter out requests outside the window
    const validRequests = existing.filter(timestamp => timestamp > windowStart)

    if (validRequests.length >= limit) {
      return { success: false, remaining: 0 }
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    // Cleanup old keys periodically (simple approach)
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanup(windowStart)
    }

    return { success: true, remaining: limit - validRequests.length }
  }

  private cleanup(windowStart: number) {
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

const inMemoryLimiter = new InMemoryRateLimiter()

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * Default rate limit configs
 */
export const RATE_LIMITS = {
  /** AI endpoints: 10 requests per minute */
  AI_ENDPOINT: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Search endpoints: 100 requests per minute */
  SEARCH_ENDPOINT: {
    limit: 100,
    windowMs: 60 * 1000,
  },
  /** General API: 1000 requests per minute */
  GENERAL: {
    limit: 1000,
    windowMs: 60 * 1000,
  },
} as const

/**
 * Check if a request is allowed under rate limit
 *
 * @param userId - User identifier
 * @param config - Rate limit configuration
 * @returns Promise resolving to rate limit result
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset?: number }> {
  const key = `ratelimit:${userId}`

  if (redis) {
    try {
      // Use Redis for distributed rate limiting
      const multi = redis.multi()
      const now = Date.now()
      const windowStart = now - config.windowMs

      // Remove old entries
      multi.zremrangebyscore(key, 0, windowStart)
      // Add current request
      multi.zadd(key, { score: now, member: `${now}:${Math.random()}` })
      // Count requests in window
      multi.zcard(key)
      // Set expiry
      multi.expire(key, Math.ceil(config.windowMs / 1000))

      const results = await multi.exec()
      const count = (results[2] as number) || 0

      const remaining = Math.max(0, config.limit - count)
      const success = count <= config.limit

      return {
        success,
        remaining,
        reset: now + config.windowMs,
      }
    } catch (error) {
      console.error('Redis rate limit error, falling back to in-memory:', error)
      // Fall back to in-memory on error
      return inMemoryLimiter.check(key, config.limit, config.windowMs)
    }
  }

  // Use in-memory rate limiter if Redis not configured
  return inMemoryLimiter.check(key, config.limit, config.windowMs)
}

/**
 * Rate limit error for throwing when limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    public remaining: number,
    public reset?: number
  ) {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
  }
}
