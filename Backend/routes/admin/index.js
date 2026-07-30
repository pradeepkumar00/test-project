const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { adminAuth, requirePermission } = require('../../middleware/adminAuth');
const authController = require('../../controllers/admin/auth');
const dashboardController = require('../../controllers/admin/dashboard');
const depositsController = require('../../controllers/admin/deposits');
const battlesController = require('../../controllers/admin/battles');
const usersController = require('../../controllers/admin/users');
const withdrawalsController = require('../../controllers/admin/withdrawals');
const kycController = require('../../controllers/admin/kyc');
const transactionsController = require('../../controllers/admin/transactions');
const settingsController = require('../../controllers/admin/settings');
const rejectionReasonsController = require('../../controllers/admin/rejectionReasons');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'BigFun Admin API is running', timestamp: new Date().toISOString() });
});

router.post('/auth/login', authController.loginValidation, validate, authController.login);

router.use(adminAuth);

router.get('/auth/profile', authController.getProfile);
router.post('/auth/logout', authController.logout);

router.get('/dashboard', requirePermission('dashboard.view'), dashboardController.getDashboard);

router.get(
  '/rejection-reasons',
  requirePermission('deposits.manage', 'withdrawals.manage'),
  rejectionReasonsController.getRejectionReasons
);

router.get('/deposits', requirePermission('deposits.view'), depositsController.listDeposits);
router.post(
  '/deposits/:id/approve',
  requirePermission('deposits.manage'),
  depositsController.approveDeposit
);
router.post(
  '/deposits/:id/reject',
  requirePermission('deposits.manage'),
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  depositsController.rejectDeposit
);

router.get('/battles', requirePermission('battles.view'), battlesController.listBattles);
router.get('/battles/:id', requirePermission('battles.view'), battlesController.getBattle);
router.post(
  '/battles/:id/cancel',
  requirePermission('battles.manage'),
  [body('reason').optional().isString()],
  validate,
  battlesController.cancelBattleHandler
);
router.delete(
  '/battles/:id',
  requirePermission('battles.manage'),
  battlesController.deleteBattleHandler
);
router.post(
  '/battles/:id/complete',
  requirePermission('battles.manage'),
  [body('winnerId').notEmpty()],
  validate,
  battlesController.forceCompleteBattle
);
router.post(
  '/battles/:id/verify',
  requirePermission('battles.manage'),
  battlesController.verifyResultHandler
);

router.get('/users', requirePermission('users.view'), usersController.listUsers);
router.get('/users/:id', requirePermission('users.view'), usersController.getUser);
router.put(
  '/users/:id/status',
  requirePermission('users.manage'),
  [body('isActive').isBoolean()],
  validate,
  usersController.updateUserStatus
);
router.post(
  '/users/:id/balance',
  requirePermission('users.balance'),
  [body('amount').isFloat({ min: 0.01 }), body('type').isIn(['credit', 'debit']), body('reason').optional().isString()],
  validate,
  usersController.adjustBalance
);

router.get('/withdrawals', requirePermission('withdrawals.view'), withdrawalsController.listWithdrawals);
router.post(
  '/withdrawals/:id/approve',
  requirePermission('withdrawals.manage'),
  withdrawalsController.approveWithdraw
);
router.post(
  '/withdrawals/:id/reject',
  requirePermission('withdrawals.manage'),
  [body('reason').trim().notEmpty().withMessage('Rejection reason is required')],
  validate,
  withdrawalsController.rejectWithdraw
);

router.get('/kyc/pending', requirePermission('kyc.view'), kycController.listPendingKyc);
router.post('/kyc/:userId/approve', requirePermission('kyc.manage'), kycController.approveKyc);
router.post(
  '/kyc/:userId/reject',
  requirePermission('kyc.manage'),
  [body('reason').optional().isString()],
  validate,
  kycController.rejectKyc
);

router.get('/transactions', requirePermission('transactions.view'), transactionsController.listTransactions);

router.get('/settings', requirePermission('settings.view'), settingsController.getSettings);
router.put(
  '/settings',
  requirePermission('settings.manage'),
  settingsController.updateSettingsValidation,
  validate,
  settingsController.updateSettings
);

module.exports = router;
