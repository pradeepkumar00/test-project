const { body } = require('express-validator');
const User = require('../models/User');
const config = require('config');
const { sendOtp, verifyOtp } = require('../services/otpService');
const { recordTransaction } = require('../services/paymentService');
const { createCustomToken, isEnabled: isFirebaseEnabled } = require('../services/firebaseService');
const { revokeToken } = require('../services/tokenBlacklistService');
const { generateToken, generateReferralCode, sanitizeUser } = require('../utils/helpers');
const { getPlatformSettings } = require('../services/platformSettingsService');

const sendOtpValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile required'),
  body('purpose').optional().isIn(['register', 'login', 'reset_password']),
];

const registerValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
  body('referralCode').optional().isString(),
  body('name').optional().trim(),
];

const loginValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const otpLoginValidation = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
];

const sendOtpHandler = async (req, res, next) => {
  try {
    const { mobile, purpose = 'login' } = req.body;
    const result = await sendOtp(mobile, purpose);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { mobile, password, otp, referralCode, name } = req.body;

    const otpResult = await verifyOtp(mobile, otp, 'register', {
      allowPurposes: ['register', 'login'],
    });

    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered' });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: String(referralCode) });
    }

    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateReferralCode();
      const exists = await User.findOne({ referralCode: code });
      if (!exists) isUnique = true;
    }

    const platform = await getPlatformSettings();
    const referralBonus = platform.referralBonus;

    const user = await User.create({
      mobile,
      password,
      name: name || '',
      referralCode: code,
      referredBy: referrer?._id || null,
      isVerified: true,
      bonusBalance: referrer ? referralBonus : 0,
    });

    if (referrer) {
      referrer.referralCount += 1;
      referrer.referralEarnings += referralBonus;
      referrer.bonusBalance += referralBonus;
      await referrer.save();

      await recordTransaction({
        userId: referrer._id,
        type: 'referral_bonus',
        amount: referralBonus,
        balanceBefore: referrer.balance,
        balanceAfter: referrer.balance,
        description: `Referral bonus for ${mobile}`,
        metadata: { referredUserId: user._id },
      });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitizeUser(user),
      referralBonus: referrer ? referralBonus : 0,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid mobile or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const loginWithOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    const otpResult = await verifyOtp(mobile, otp, 'login');

    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
};

const getFirebaseToken = async (req, res, next) => {
  try {
    if (!isFirebaseEnabled()) {
      return res.status(503).json({ success: false, message: 'Firebase wallet sync is not enabled' });
    }

    const firebaseToken = await createCustomToken(req.user._id.toString());
    res.json({ success: true, firebaseToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.authToken) {
      await revokeToken(req.authToken, 'user', config.get('jwt.secret'));
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, upiId, accountHolder, accountNumber, ifsc, bankName } = req.body;

    if (name !== undefined) req.user.name = String(name).trim();
    if (upiId !== undefined || accountHolder !== undefined || accountNumber !== undefined || ifsc !== undefined || bankName !== undefined) {
      req.user.bankDetails = {
        accountHolder: accountHolder ?? req.user.bankDetails?.accountHolder ?? '',
        accountNumber: accountNumber ?? req.user.bankDetails?.accountNumber ?? '',
        ifsc: ifsc ?? req.user.bankDetails?.ifsc ?? '',
        upiId: upiId ?? req.user.bankDetails?.upiId ?? '',
        bankName: bankName ?? req.user.bankDetails?.bankName ?? '',
      };
    }

    await req.user.save();
    res.json({ success: true, message: 'Profile updated successfully', user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    if (req.authToken) {
      await revokeToken(req.authToken, 'user', config.get('jwt.secret'));
    }

    res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    const otpResult = await verifyOtp(mobile, otp, 'reset_password');

    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

const validateReferral = async (req, res, next) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ referralCode: code }).select('name referralCode referralCount');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    const platform = await getPlatformSettings();

    res.json({
      success: true,
      referral: {
        code: user.referralCode,
        referrerName: user.name || 'User',
        bonus: platform.referralBonus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtpValidation,
  registerValidation,
  loginValidation,
  otpLoginValidation,
  sendOtpHandler,
  register,
  login,
  loginWithOtp,
  getProfile,
  getFirebaseToken,
  logout,
  updateProfile,
  changePassword,
  resetPassword,
  validateReferral,
};
