const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const profileController = require('../controllers/profile');

const router = express.Router();

router.use(auth);

router.get('/stats', profileController.getProfileStats);
router.get('/history', profileController.getHistory);
router.post(
  '/kyc/aadhaar/send-otp',
  [body('aadhaarNumber').isString().notEmpty().withMessage('Aadhaar number is required')],
  validate,
  profileController.sendProfileAadhaarOtp
);
router.post(
  '/kyc/aadhaar/verify-otp',
  [body('otp').isString().notEmpty().withMessage('OTP is required')],
  validate,
  profileController.verifyProfileAadhaarOtp
);
router.post(
  '/kyc',
  [body('aadhaarNumber').optional().isString()],
  validate,
  profileController.submitKyc
);

module.exports = router;
