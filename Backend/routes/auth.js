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
router.put('/profile', auth, authController.updateProfile);
router.put(
  '/change-password',
  auth,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  authController.changePassword
);

module.exports = router;
