const express = require('express');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { adminAuth, superAdminOnly } = require('../../middleware/adminAuth');
const authController = require('../../controllers/admin/auth');
const dashboardController = require('../../controllers/admin/dashboard');
const depositsController = require('../../controllers/admin/deposits');
const battlesController = require('../../controllers/admin/battles');
const usersController = require('../../controllers/admin/users');
const withdrawalsController = require('../../controllers/admin/withdrawals');
const kycController = require('../../controllers/admin/kyc');
const transactionsController = require('../../controllers/admin/transactions');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'BigFun Admin API is running', timestamp: new Date().toISOString() });
});

router.post('/auth/login', authController.loginValidation, validate, authController.login);

router.use(adminAuth);

router.get('/auth/profile', authController.getProfile);
router.post('/auth/logout', authController.logout);
router.get('/dashboard', dashboardController.getDashboard);

router.get('/deposits', depositsController.listDeposits);
router.post('/deposits/:id/approve', depositsController.approveDeposit);
router.post('/deposits/:id/reject', [body('reason').optional().isString()], validate, depositsController.rejectDeposit);

router.get('/battles', battlesController.listBattles);
router.get('/battles/:id', battlesController.getBattle);
router.post('/battles/:id/cancel', [body('reason').optional().isString()], validate, battlesController.cancelBattleHandler);
router.delete('/battles/:id', battlesController.deleteBattleHandler);
router.post(
  '/battles/:id/complete',
  [body('winnerId').notEmpty()],
  validate,
  battlesController.forceCompleteBattle
);

router.get('/users', usersController.listUsers);
router.get('/users/:id', usersController.getUser);
router.put('/users/:id/status', [body('isActive').isBoolean()], validate, usersController.updateUserStatus);
router.post(
  '/users/:id/balance',
  superAdminOnly,
  [body('amount').isFloat({ min: 0.01 }), body('type').isIn(['credit', 'debit']), body('reason').optional().isString()],
  validate,
  usersController.adjustBalance
);

router.get('/withdrawals', withdrawalsController.listWithdrawals);
router.post('/withdrawals/:id/approve', withdrawalsController.approveWithdraw);
router.post('/withdrawals/:id/reject', [body('reason').optional().isString()], validate, withdrawalsController.rejectWithdraw);

router.get('/kyc/pending', kycController.listPendingKyc);
router.post('/kyc/:userId/approve', kycController.approveKyc);
router.post('/kyc/:userId/reject', [body('reason').optional().isString()], validate, kycController.rejectKyc);

router.get('/transactions', transactionsController.listTransactions);

module.exports = router;
