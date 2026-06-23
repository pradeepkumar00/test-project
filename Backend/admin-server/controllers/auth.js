const { body } = require('express-validator');
const User = require('../../models/User');
const { generateAdminToken } = require('../../utils/adminToken');

const loginValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid mobile required'),
  body('password').notEmpty().withMessage('Password required'),
];

const login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Not an admin account' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateAdminToken(user);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      mobile: req.admin.mobile,
      role: req.admin.role,
    },
  });
};

module.exports = { loginValidation, login, getProfile };
