const express = require('express');
const settingsController = require('../controllers/settings');
const authRoutes = require('./auth');
const walletRoutes = require('./wallet');
const gamesRoutes = require('./games');
const referralRoutes = require('./referral');
const battlesRoutes = require('./battles');
const homeRoutes = require('./home');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');

const router = express.Router();

router.get('/health', settingsController.healthCheck);
router.get('/settings', settingsController.getSettings);

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/games', gamesRoutes);
router.use('/referral', referralRoutes);
router.use('/battles', battlesRoutes);
router.use('/home', homeRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
