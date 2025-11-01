/**
 * Help article caching layer
 *
 * Caches frequently accessed help articles in memory to reduce database load.
 * Articles are cached for 1 hour and invalidated on updates.
 */

import { HelpArticle, HelpCategory } from '@prisma/client'

interface CachedArticle {
  data: HelpArticle
  timestamp: number
}

interface CachedArticleList {
  data: HelpArticle[]
  timestamp: number
}

/**
 * In-memory cache for help articles
 * Using Map for O(1) lookups
 */
class HelpArticleCache {
  private articlesBySlug: Map<string, CachedArticle> = new Map()
  private articlesByCategory: Map<HelpCategory, CachedArticleList> = new Map()
  private allArticles: CachedArticleList | null = null
  private readonly TTL_MS = 60 * 60 * 1000 // 1 hour

  /**
   * Get article by slug from cache
   */
  getBySlug(slug: string): HelpArticle | null {
    const cached = this.articlesBySlug.get(slug)
    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL_MS) {
      this.articlesBySlug.delete(slug)
      return null
    }

    return cached.data
  }

  /**
   * Set article in cache by slug
   */
  setBySlug(slug: string, article: HelpArticle): void {
    this.articlesBySlug.set(slug, {
      data: article,
      timestamp: Date.now(),
    })
  }

  /**
   * Get articles by category from cache
   */
  getByCategory(category: HelpCategory): HelpArticle[] | null {
    const cached = this.articlesByCategory.get(category)
    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL_MS) {
      this.articlesByCategory.delete(category)
      return null
    }

    return cached.data
  }

  /**
   * Set articles in cache by category
   */
  setByCategory(category: HelpCategory, articles: HelpArticle[]): void {
    this.articlesByCategory.set(category, {
      data: articles,
      timestamp: Date.now(),
    })
  }

  /**
   * Get all articles from cache
   */
  getAll(): HelpArticle[] | null {
    if (!this.allArticles) return null

    // Check if expired
    if (Date.now() - this.allArticles.timestamp > this.TTL_MS) {
      this.allArticles = null
      return null
    }

    return this.allArticles.data
  }

  /**
   * Set all articles in cache
   */
  setAll(articles: HelpArticle[]): void {
    this.allArticles = {
      data: articles,
      timestamp: Date.now(),
    }
  }

  /**
   * Invalidate all caches
   * Called when articles are updated
   */
  invalidateAll(): void {
    this.articlesBySlug.clear()
    this.articlesByCategory.clear()
    this.allArticles = null
  }

  /**
   * Invalidate specific article by slug
   */
  invalidateBySlug(slug: string): void {
    this.articlesBySlug.delete(slug)
    // Also invalidate category and all caches as they may contain this article
    this.articlesByCategory.clear()
    this.allArticles = null
  }

  /**
   * Get cache stats for monitoring
   */
  getStats(): {
    slugCacheSize: number
    categoryCacheSize: number
    hasAllArticles: boolean
  } {
    return {
      slugCacheSize: this.articlesBySlug.size,
      categoryCacheSize: this.articlesByCategory.size,
      hasAllArticles: this.allArticles !== null,
    }
  }
}

/**
 * Singleton cache instance
 */
export const helpArticleCache = new HelpArticleCache()
