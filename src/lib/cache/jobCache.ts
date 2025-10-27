import type { Job } from '@/lib/scrapers/types';

interface CacheEntry {
  jobs: Job[];
  timestamp: number;
  query: string;
  location: string;
  sources: string[];
  count: number;
}

class JobCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 100;

  private generateKey(query: string, location: string, sources: string[]): string {
    return `${query.toLowerCase()}-${location.toLowerCase()}-${sources.sort().join(',')}`;
  }

  set(query: string, location: string, sources: string[], jobs: Job[]): void {
    const key = this.generateKey(query, location, sources);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      jobs,
      timestamp: Date.now(),
      query,
      location,
      sources,
      count: jobs.length
    });

    console.log(`📦 Cached ${jobs.length} jobs for "${query}" in "${location}"`);
  }

  get(query: string, location: string, sources: string[]): Job[] | null {
    const key = this.generateKey(query, location, sources);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      console.log(`🗑️ Cache expired for "${query}" in "${location}"`);
      return null;
    }

    console.log(`⚡ Cache hit! Returning ${entry.count} jobs for "${query}" in "${location}"`);
    return entry.jobs;
  }

  has(query: string, location: string, sources: string[]): boolean {
    const key = this.generateKey(query, location, sources);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Job cache cleared');
  }

  getStats(): { size: number; entries: Array<{ key: string; count: number; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      age: Math.round((Date.now() - entry.timestamp) / 1000) // age in seconds
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }
}

// Singleton instance
export const jobCache = new JobCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  jobCache.cleanup();
}, 5 * 60 * 1000);

// Export types
export type { CacheEntry };
