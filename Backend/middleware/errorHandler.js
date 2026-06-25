const logger = require('../utils/logger');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const errorHandler = (err, req, res, next) => {
  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: getClientIp(req),
    statusCode: err.status || 500,
    errorName: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    actorId: req.admin?._id?.toString() || req.user?._id?.toString(),
    actorType: req.admin ? 'admin' : req.user ? 'user' : 'anonymous',
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
