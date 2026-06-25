const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const walletController = require('../controllers/wallet');

const router = express.Router();

router.use(auth);

router.get('/balance', walletController.getBalance);
router.get('/payment-details', walletController.getPaymentDetails);
router.post('/deposit/generate-qr', walletController.depositQrValidation, validate, walletController.generateDepositQr);
router.post('/deposit/submit', walletController.depositSubmitValidation, validate, walletController.submitDeposit);
router.post('/withdraw', walletController.withdrawValidation, validate, walletController.requestWithdraw);
router.get('/transactions', walletController.getTransactions);
router.get('/deposits', walletController.getDeposits);
router.get('/withdrawals', walletController.getWithdrawals);
router.put('/bank-details', walletController.updateBankDetails);

module.exports = router;
