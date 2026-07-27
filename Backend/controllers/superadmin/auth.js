const { body } = require('express-validator');
const config = require('config');
const Admin = require('../../models/Admin');
const { generateAdminToken } = require('../../utils/adminToken');
const { revokeToken } = require('../../services/tokenBlacklistService');
const { getEffectivePermissions } = require('../../constants/adminPermissions');

const loginValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid mobile required'),
  body('password').notEmpty().withMessage('Password required'),
];

const formatSuperAdminSession = (admin) => ({
  id: admin._id,
  name: admin.name?.trim() || 'Super Admin',
  mobile: admin.mobile,
  role: admin.role,
  permissions: getEffectivePermissions(admin),
});

/** Superadmin portal login — rejects staff admin accounts. */
const login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;
    const admin = await Admin.findOne({ mobile }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Superadmin access only. Use the Admin portal for staff accounts.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateAdminToken(admin);

    res.json({
      success: true,
      message: 'Superadmin login successful',
      token,
      admin: formatSuperAdminSession(admin),
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Superadmin access required' });
  }

  res.json({
    success: true,
    admin: formatSuperAdminSession(req.admin),
  });
};

const logout = async (req, res, next) => {
  try {
    if (req.authToken) {
      await revokeToken(req.authToken, 'admin', config.get('adminJwt.secret'));
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { loginValidation, login, getProfile, logout };
