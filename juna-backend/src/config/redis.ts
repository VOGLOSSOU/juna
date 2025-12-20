import Redis from 'ioredis';
import { env } from './env';

// Configuration Redis
const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Instance Redis
const redis = new Redis(redisConfig);

// Events Redis
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('🔴 Redis connection closed');
});

// Helper functions pour le cache
export const cacheHelper = {
  // Définir une valeur dans le cache
  set: async (key: string, value: any, ttl?: number): Promise<void> => {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  },

  // Récupérer une valeur du cache
  get: async <T>(key: string): Promise<T | null> => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Supprimer une clé du cache
  del: async (key: string): Promise<void> => {
    await redis.del(key);
  },

  // Supprimer plusieurs clés par pattern
  delPattern: async (pattern: string): Promise<void> => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // Vérifier si une clé existe
  exists: async (key: string): Promise<boolean> => {
    const result = await redis.exists(key);
    return result === 1;
  },

  // Définir une expiration sur une clé
  expire: async (key: string, ttl: number): Promise<void> => {
    await redis.expire(key, ttl);
  },
};

export default redis;