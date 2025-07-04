import { Redis } from '@upstash/redis';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
config({ path: path.join(__dirname, '../../.env') });

// Validate required environment variables
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;

if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
  throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set in environment variables');
}

class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis({
      url: UPSTASH_REDIS_URL,
      token: UPSTASH_REDIS_TOKEN,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (data === null) {
        return null; // Cache miss
      }
      return JSON.parse(data as string) as T; // Attempt to parse
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      // If parsing fails (e.g., SyntaxError), delete the corrupted key
      if (error instanceof SyntaxError) {
        console.warn(`Deleting corrupted cache key: ${key}`);
        await this.delete(key); // Delete the invalid entry
      }
      return null; // Return null on any error
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), { ex: ttl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export const cacheService = new CacheService(); 