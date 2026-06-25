const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

const REVOKED_PREFIX = 'token:revoked';

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getRevokedKey = (audience, identifier) => `${REVOKED_PREFIX}:${audience}:${identifier}`;

const getTokenIdentifier = (decoded, token) => decoded.jti || hashToken(token);

const getRemainingTtl = (decoded) => {
  if (!decoded?.exp) {
    return 0;
  }

  return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
};

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.split(' ')[1];
};

const revokeToken = async (token, audience, secret) => {
  const decoded = jwt.verify(token, secret);
  const ttl = getRemainingTtl(decoded);

  if (ttl <= 0) {
    return decoded;
  }

  const redis = getRedis();
  const identifier = getTokenIdentifier(decoded, token);
  await redis.setex(getRevokedKey(audience, identifier), ttl, '1');

  return decoded;
};

const isTokenRevoked = async (decoded, token, audience) => {
  try {
    const redis = getRedis();
    const identifier = getTokenIdentifier(decoded, token);
    const revoked = await redis.get(getRevokedKey(audience, identifier));
    return Boolean(revoked);
  } catch (error) {
    logger.warn('Token revocation check skipped (Redis unavailable)', {
      audience,
      message: error.message,
    });
    return false;
  }
};

const createJwtId = () => crypto.randomUUID();

module.exports = {
  createJwtId,
  extractBearerToken,
  revokeToken,
  isTokenRevoked,
};
