const config = require('config');
const logger = require('../utils/logger');

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'otp',
  'token',
  'authtoken',
  'authorization',
  'refreshtoken',
  'firebasetoken',
  'secret',
  'auth',
  'accesstoken',
  'panumber',
  'pannumber',
  'aadhaarnumber',
]);

const REDACTED = '[REDACTED]';

const getLoggingConfig = () => {
  try {
    return config.get('logging');
  } catch {
    return {};
  }
};

const shouldSkipPath = (path, skipPaths = []) =>
  skipPaths.some((entry) => path === entry || path.startsWith(`${entry}/`));

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const maskAuthorization = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }

  if (value.startsWith('Bearer ')) {
    return 'Bearer [REDACTED]';
  }

  return REDACTED;
};

const sanitizeValue = (key, value) => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    return REDACTED;
  }

  return value;
};

const sanitizeData = (input, depth = 0) => {
  if (depth > 4) {
    return '[TRUNCATED]';
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof input !== 'object') {
    return input;
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    acc[key] = sanitizeData(sanitizeValue(key, value), depth + 1);
    return acc;
  }, {});
};

const getRequestActor = (req) => {
  if (req.admin) {
    return {
      actorType: 'admin',
      actorId: req.admin._id?.toString(),
      actorMobile: req.admin.mobile,
      actorRole: req.admin.role,
    };
  }

  if (req.user) {
    return {
      actorType: 'user',
      actorId: req.user._id?.toString(),
      actorMobile: req.user.mobile,
      actorRole: req.user.role,
    };
  }

  return { actorType: 'anonymous' };
};

const requestLogger = (req, res, next) => {
  const loggingConfig = getLoggingConfig();
  const skipPaths = loggingConfig.skipPaths || ['/api/health', '/api/admin/health'];
  const requestPath = req.originalUrl || req.url;

  if (shouldSkipPath(requestPath, skipPaths)) {
    return next();
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const contentLength = res.getHeader('content-length');

    const entry = {
      requestId: req.headers['x-request-id'] || undefined,
      method: req.method,
      path: requestPath,
      route: req.route?.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || req.headers.referrer,
      contentType: req.headers['content-type'],
      contentLength: contentLength ? Number(contentLength) : undefined,
      ...getRequestActor(req),
    };

    if (loggingConfig.logQuery !== false && Object.keys(req.query || {}).length) {
      entry.query = sanitizeData(req.query);
    }

    if (
      loggingConfig.logRequestBody !== false &&
      req.body &&
      typeof req.body === 'object' &&
      Object.keys(req.body).length &&
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    ) {
      entry.body = sanitizeData(req.body);
    }

    if (loggingConfig.logHeaders) {
      entry.headers = sanitizeData({
        ...req.headers,
        authorization: maskAuthorization(req.headers.authorization),
      });
    }

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP request', entry);
  });

  next();
};

module.exports = requestLogger;
