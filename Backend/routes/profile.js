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
  '/kyc',
  [body('panNumber').optional().isString(), body('aadhaarNumber').optional().isString()],
  validate,
  profileController.submitKyc
);

module.exports = router;
