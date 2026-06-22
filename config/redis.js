const config = require('config');
const Redis = require('ioredis');

let redis;

const connectRedis = async () => {
  if (redis) return redis;

  const redisConfig = config.get('redis');
  const options = redisConfig.url
    ? redisConfig.url
    : {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
        connectTimeout: 5000,
      };

  redis = new Redis(options);

  try {
    await redis.ping();
    console.log('Redis connected');
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
