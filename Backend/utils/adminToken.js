const config = require('config');
const jwt = require('jsonwebtoken');
const { createJwtId } = require('../services/tokenBlacklistService');

const generateAdminToken = (admin) =>
  jwt.sign(
    {
      adminId: admin._id,
      userId: admin._id, // backward-compatible claim
      role: admin.role,
      type: 'admin',
    },
    config.get('adminJwt.secret'),
    {
      expiresIn: config.get('adminJwt.expiresIn'),
      jwtid: createJwtId(),
    }
  );

const verifyAdminToken = (token) =>
  jwt.verify(token, config.get('adminJwt.secret'));

module.exports = { generateAdminToken, verifyAdminToken };
