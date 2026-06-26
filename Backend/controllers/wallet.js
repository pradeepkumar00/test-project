const config = require('config');
const { body } = require('express-validator');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const User = require('../models/User');
const { getRedis } = require('../config/redis');
const { createDepositQr } = require('../services/upiQrService');
const { submitDepositRequest, completeDeposit, recordTransaction } = require('../services/paymentService');
const { publishWalletUpdate } = require('../services/firebaseService');
const { generateOrderId } = require('../utils/helpers');
const { getPlatformSettings } = require('../services/platformSettingsService');

const depositQrValidation = [
  body('amount').custom(async (value) => {
    const platform = await getPlatformSettings();
    if (parseFloat(value) < platform.minDeposit) {
      throw new Error(`Minimum deposit is ₹${platform.minDeposit}`);
    }
    return true;
  }),
];

const depositSubmitValidation = [
  body('amount').custom(async (value) => {
    const platform = await getPlatformSettings();
    if (parseFloat(value) < platform.minDeposit) {
      throw new Error(`Minimum deposit is ₹${platform.minDeposit}`);
    }
    return true;
  }),
  body('utrNumber').notEmpty().trim().withMessage('UTR / Transaction ID is required'),
  body('orderId').optional().isString().trim(),
  body('paymentMethod').optional().custom(async (value) => {
    if (!value) return true;
    const platform = await getPlatformSettings();
    if (!platform.paymentMethods.includes(value)) {
      throw new Error('Invalid payment method');
    }
    return true;
  }),
];

const withdrawValidation = [
  body('amount').custom(async (value) => {
    const platform = await getPlatformSettings();
    if (parseFloat(value) < platform.minWithdraw) {
      throw new Error(`Minimum withdrawal is ₹${platform.minWithdraw}`);
    }
    return true;
  }),
  body('method').custom(async (value) => {
    const platform = await getPlatformSettings();
    if (!platform.withdrawMethods.includes(value)) {
      throw new Error('Invalid withdrawal method');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password required for withdrawal'),
];

const getBalance = async (req, res) => {
  res.json({
    success: true,
    walletBalance: req.user.balance + req.user.bonusBalance,
    income: req.user.income,
    balance: {
      main: req.user.balance,
      bonus: req.user.bonusBalance,
      total: req.user.balance + req.user.bonusBalance,
    },
  });
};

const getPaymentDetails = async (req, res) => {
  const platform = await getPlatformSettings();
  res.json({
    success: true,
    payment: {
      label: platform.paymentLabel,
      upiId: platform.upiId,
      upiPayeeName: platform.upiPayeeName,
      upiQrImage: config.get('wallet.upiQrImage'),
      minDeposit: platform.minDeposit,
      instructions: 'Enter amount and tap Add to generate a QR code. Pay the exact amount, then submit your transaction ID for admin approval.',
    },
  });
};

const verifyDepositIntent = async (orderId, userId, amount) => {
  const redis = getRedis();
  const raw = await redis.get(`deposit:intent:${orderId}`);
  if (!raw) {
    throw new Error('Deposit session expired. Please generate a new QR code.');
  }

  const intent = JSON.parse(raw);
  if (intent.userId !== userId.toString()) {
    throw new Error('Invalid deposit session');
  }
  if (Math.abs(parseFloat(intent.amount) - parseFloat(amount)) > 0.01) {
    throw new Error('Amount does not match the generated QR code');
  }

  return intent;
};

const generateDepositQr = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const orderId = generateOrderId();
    const qr = await createDepositQr({ amount, orderId });
    const expiryMinutes = config.get('wallet.depositQrExpiryMinutes') || 30;

    const redis = getRedis();
    await redis.setex(
      `deposit:intent:${orderId}`,
      expiryMinutes * 60,
      JSON.stringify({
        userId: req.user._id.toString(),
        amount,
        createdAt: Date.now(),
      })
    );

    res.json({
      success: true,
      depositQr: {
        orderId,
        amount,
        upiId: qr.upiId,
        payeeName: qr.payeeName,
        qrDataUrl: qr.qrDataUrl,
        upiUri: qr.upiUri,
        expiresInMinutes: expiryMinutes,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const submitDeposit = async (req, res, next) => {
  try {
    const { amount, utrNumber, paymentMethod = 'UPI', orderId } = req.body;
    const parsedAmount = parseFloat(amount);

    if (orderId) {
      await verifyDepositIntent(orderId, req.user._id, parsedAmount);
    }

    const pendingCount = await Deposit.countDocuments({
      user: req.user._id,
      status: 'pending',
    });

    if (pendingCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You already have pending deposit requests. Please wait for admin approval.',
      });
    }

    const deposit = await submitDepositRequest({
      userId: req.user._id,
      amount: parsedAmount,
      utrNumber: utrNumber.trim(),
      paymentMethod,
      orderId: orderId || null,
    });

    if (orderId) {
      const redis = getRedis();
      await redis.del(`deposit:intent:${orderId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Deposit submitted. Admin will verify and approve shortly.',
      deposit: {
        id: deposit._id,
        orderId: deposit.orderId,
        amount: deposit.amount,
        utrNumber: deposit.utrNumber,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const requestWithdraw = async (req, res, next) => {
  try {
    const { amount, method, password, upiId, accountNumber, ifsc, accountHolder } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const pendingWithdraw = await Withdraw.findOne({
      user: user._id,
      status: { $in: ['pending', 'processing'] },
    });

    if (pendingWithdraw) {
      return res.status(400).json({ success: false, message: 'You already have a pending withdrawal' });
    }

    const balanceBefore = user.balance;
    user.balance -= amount;
    user.totalWithdrawn += amount;
    await user.save();

    const withdraw = await Withdraw.create({
      user: user._id,
      amount,
      method,
      upiId: upiId || user.bankDetails?.upiId,
      accountNumber: accountNumber || user.bankDetails?.accountNumber,
      ifsc: ifsc || user.bankDetails?.ifsc,
      accountHolder: accountHolder || user.bankDetails?.accountHolder,
      status: 'pending',
    });

    await recordTransaction({
      userId: user._id,
      type: 'withdraw',
      amount: -amount,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'pending',
      paymentMethod: method,
      referenceId: withdraw._id.toString(),
      description: `Withdrawal request via ${method}`,
    });

    await publishWalletUpdate(user, 'withdrawal_requested', { withdrawId: withdraw._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Processing within 24 hours.',
      withdraw: {
        id: withdraw._id,
        amount: withdraw.amount,
        method: withdraw.method,
        status: withdraw.status,
        createdAt: withdraw.createdAt,
      },
      balance: user.balance,
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const type = req.query.type;

    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, deposits });
  } catch (error) {
    next(error);
  }
};

const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdraw.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, withdrawals });
  } catch (error) {
    next(error);
  }
};

const updateBankDetails = async (req, res, next) => {
  try {
    const { accountHolder, accountNumber, ifsc, upiId, bankName } = req.body;
    req.user.bankDetails = {
      accountHolder: accountHolder || req.user.bankDetails?.accountHolder,
      accountNumber: accountNumber || req.user.bankDetails?.accountNumber,
      ifsc: ifsc || req.user.bankDetails?.ifsc,
      upiId: upiId || req.user.bankDetails?.upiId,
      bankName: bankName || req.user.bankDetails?.bankName,
    };
    await req.user.save();
    res.json({ success: true, message: 'Bank details updated', bankDetails: req.user.bankDetails });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  depositQrValidation,
  depositSubmitValidation,
  withdrawValidation,
  getBalance,
  getPaymentDetails,
  generateDepositQr,
  submitDeposit,
  requestWithdraw,
  getTransactions,
  getDeposits,
  getWithdrawals,
  updateBankDetails,
};
