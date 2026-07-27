const { body } = require('express-validator');
const Admin = require('../../models/Admin');
const {
  ADMIN_PERMISSIONS,
  sanitizePermissions,
  getEffectivePermissions,
} = require('../../constants/adminPermissions');

const formatAdmin = (admin) => ({
  id: admin._id.toString(),
  name: admin.name?.trim() || (admin.role === 'superadmin' ? 'Super Admin' : 'Admin'),
  mobile: admin.mobile,
  role: admin.role,
  permissions:
    admin.role === 'superadmin'
      ? getEffectivePermissions(admin)
      : sanitizePermissions(admin.permissions),
  isActive: admin.isActive,
  lastLoginAt: admin.lastLoginAt || null,
  createdAt: admin.createdAt,
});

const listPermissionCatalog = (req, res) => {
  res.json({
    success: true,
    permissions: ADMIN_PERMISSIONS,
  });
};

const listAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find({})
      .sort({ role: -1, createdAt: -1 })
      .select('name mobile role permissions isActive lastLoginAt createdAt');

    res.json({
      success: true,
      admins: admins.map(formatAdmin),
    });
  } catch (error) {
    next(error);
  }
};

const createAdminValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().isString().trim(),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
];

const createAdmin = async (req, res, next) => {
  try {
    const { mobile, password, name = '', permissions = [] } = req.body;
    const existing = await Admin.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An admin with this mobile already exists',
      });
    }

    const admin = await Admin.create({
      mobile,
      password,
      name: name || 'Admin',
      role: 'admin',
      permissions: sanitizePermissions(permissions),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: formatAdmin(admin),
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminValidation = [
  body('name').optional().isString().trim(),
  body('permissions').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const updateAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select('+password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'superadmin' && admin._id.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify another superadmin account',
      });
    }

    if (admin._id.toString() === req.admin._id.toString() && req.body.isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    if (typeof req.body.name === 'string') {
      admin.name = req.body.name.trim();
    }

    if (Array.isArray(req.body.permissions)) {
      if (admin.role === 'superadmin') {
        // Superadmin always has full access; ignore custom list
      } else {
        admin.permissions = sanitizePermissions(req.body.permissions);
      }
    }

    if (typeof req.body.isActive === 'boolean' && admin.role === 'admin') {
      admin.isActive = req.body.isActive;
    }

    if (req.body.password) {
      admin.password = req.body.password;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin: formatAdmin(admin),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    if (admin.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a superadmin account' });
    }

    await Admin.deleteOne({ _id: admin._id });

    res.json({
      success: true,
      message: 'Admin deleted successfully',
      deletedId: admin._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPermissionCatalog,
  listAdmins,
  createAdminValidation,
  createAdmin,
  updateAdminValidation,
  updateAdmin,
  deleteAdmin,
};
