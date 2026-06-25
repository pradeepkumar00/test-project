const config = require('config');
const jwt = require('jsonwebtoken');
const { createJwtId } = require('../services/tokenBlacklistService');

const generateAdminToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, type: 'admin' },
    config.get('adminJwt.secret'),
    {
      expiresIn: config.get('adminJwt.expiresIn'),
      jwtid: createJwtId(),
    }
  );

const verifyAdminToken = (token) =>
  jwt.verify(token, config.get('adminJwt.secret'));

module.exports = { generateAdminToken, verifyAdminToken };
