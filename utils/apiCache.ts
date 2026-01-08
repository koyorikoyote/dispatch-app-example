/**
 * API Cache Utility
 * Provides caching functionality for API responses with TTL support
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = "api_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export class ApiCache {
  /**
   * Store data in cache with TTL
   */
  static async set<T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error("Failed to cache data:", error);
    }
  }

  /**
   * Retrieve data from cache if not expired
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - entry.timestamp > entry.ttl) {
        // Remove expired cache
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error("Failed to retrieve cached data:", error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error("Failed to remove cache:", error);
    }
  }

  /**
   * Clear all cache entries
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(
        (key) => key.startsWith(CACHE_PREFIX) && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error("Failed to invalidate cache pattern:", error);
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  static async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  if (!params) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return `${endpoint}?${sortedParams}`;
}
