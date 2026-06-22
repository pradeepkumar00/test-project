const express = require('express');
const auth = require('../middleware/auth');
const referralController = require('../controllers/referral');

const router = express.Router();

router.use(auth);

router.get('/code', referralController.getReferralCode);
router.get('/stats', referralController.getReferralStats);
router.get('/users', referralController.getReferredUsers);

module.exports = router;
