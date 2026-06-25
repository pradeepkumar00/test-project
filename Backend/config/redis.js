const config = require('config');
const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

const connectRedis = async () => {
  if (redis) return redis;

  const redisConfig = config.get('redis');
  const common = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    connectTimeout: 5000,
    keyPrefix: redisConfig.keyPrefix || undefined,
  };

  if (redisConfig.url) {
    redis = new Redis(redisConfig.url, {
      ...common,
      password: redisConfig.password || undefined,
    });
  } else {
    redis = new Redis({
      ...common,
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
    });
  }

  try {
    await redis.ping();
    logger.info('Redis connected');
    return redis;
  } catch (error) {
    redis.disconnect();
    redis = null;

    if (error.message.includes('NOAUTH')) {
      throw new Error(
        'Redis authentication required. Set redis.password in config/local.json or REDIS_PASSWORD env var'
      );
    }

    throw new Error(`Redis connection failed: ${error.message}`);
  }
};

const getRedis = () => {
  if (!redis) throw new Error('Redis not connected. Call connectRedis() first.');
  return redis;
};

module.exports = { connectRedis, getRedis };
