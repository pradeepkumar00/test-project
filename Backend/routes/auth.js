const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/send-otp', authController.sendOtpValidation, validate, authController.sendOtpHandler);
router.post('/register', authController.registerValidation, validate, authController.register);
router.post('/login', authController.loginValidation, validate, authController.login);
router.post('/login/otp', authController.otpLoginValidation, validate, authController.loginWithOtp);
router.post(
  '/reset-password',
  [
    body('mobile').matches(/^[6-9]\d{9}$/),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  authController.resetPassword
);
router.get('/referral/:code', authController.validateReferral);

router.get('/profile', auth, authController.getProfile);
router.post('/logout', auth, authController.logout);
router.get('/firebase-token', auth, authController.getFirebaseToken);
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().isLength({ max: 80 }).withMessage('Name is too long'),
    body('upiId').optional().trim(),
    body('accountHolder').optional().trim(),
    body('accountNumber').optional().trim(),
    body('ifsc').optional().trim(),
    body('bankName').optional().trim(),
  ],
  validate,
  authController.updateProfile
);
router.put(
  '/change-password',
  auth,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  authController.changePassword
);

module.exports = router;
