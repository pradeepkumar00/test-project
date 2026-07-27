const Admin = require('../models/Admin');
const { verifyAdminToken } = require('../utils/adminToken');
const { isTokenRevoked } = require('../services/tokenBlacklistService');
const { hasPermission, hasAnyPermission } = require('../constants/adminPermissions');
const logger = require('../utils/logger');

const adminAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const token = header.split(' ')[1];
    const decoded = verifyAdminToken(token);

    if (decoded.type !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }

    if (await isTokenRevoked(decoded, token, 'admin')) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const adminId = decoded.adminId || decoded.userId;
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive || !['admin', 'superadmin'].includes(admin.role)) {
      return res.status(403).json({ success: false, message: 'Admin access denied' });
    }

    req.admin = admin;
    req.authToken = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
    }

    logger.error('Admin auth failed', { message: error.message, name: error.name });
    return res.status(503).json({
      success: false,
      message: 'Authentication service temporarily unavailable. Please try again.',
    });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Superadmin access required' });
  }
  next();
};

const requirePermission = (...permissions) => (req, res, next) => {
  const needed = permissions.flat();
  if (!needed.length || hasAnyPermission(req.admin, needed)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'You do not have permission for this action',
    required: needed,
  });
};

const requireAllPermissions = (...permissions) => (req, res, next) => {
  const needed = permissions.flat();
  const ok = needed.every((p) => hasPermission(req.admin, p));
  if (ok) return next();
  return res.status(403).json({
    success: false,
    message: 'You do not have permission for this action',
    required: needed,
  });
};

module.exports = {
  adminAuth,
  superAdminOnly,
  requirePermission,
  requireAllPermissions,
};
