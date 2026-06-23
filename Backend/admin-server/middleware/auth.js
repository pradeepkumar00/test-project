const User = require('../../models/User');
const { verifyAdminToken } = require('../../utils/adminToken');

const auth = async (req, res, next) => {
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

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access denied' });
    }

    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Superadmin access required' });
  }
  next();
};

module.exports = { auth, superAdminOnly };
