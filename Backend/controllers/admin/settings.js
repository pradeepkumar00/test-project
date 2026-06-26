const { body } = require('express-validator');
const {
  getPlatformSettings,
  updatePlatformSettings,
  getSupportedCurrencies,
  getPaymentMethodOptions,
  getWithdrawMethodOptions,
  CURRENCY_SYMBOLS,
  PAYMENT_METHOD_OPTIONS,
  WITHDRAW_METHOD_OPTIONS,
} = require('../../services/platformSettingsService');

const supportedCurrencyCodes = Object.keys(CURRENCY_SYMBOLS);

const parseFee = (value, label) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${label} is required`);
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a valid number`);
  }
  return num;
};

const updateSettingsValidation = [
  body('upiId').trim().notEmpty().withMessage('UPI ID is required'),
  body('upiPayeeName').trim().notEmpty().withMessage('UPI payee name is required'),
  body('paymentLabel').trim().notEmpty().withMessage('Payment label is required'),
  body('minEntryFee').custom((value) => {
    const min = parseFee(value, 'Minimum entry fee');
    if (min < 1) {
      throw new Error('Minimum entry fee must be at least ₹1');
    }
    return true;
  }),
  body('maxEntryFee').custom((value, { req }) => {
    const max = parseFee(value, 'Maximum entry fee');
    if (max < 1) {
      throw new Error('Maximum entry fee must be at least ₹1');
    }
    const min = parseFee(req.body.minEntryFee, 'Minimum entry fee');
    if (max < min) {
      throw new Error(
        `Maximum entry fee (₹${max}) must be greater than or equal to minimum entry fee (₹${min})`
      );
    }
    return true;
  }),
  body('minDeposit').custom((value) => {
    const min = parseFee(value, 'Minimum deposit');
    if (min < 1) {
      throw new Error('Minimum deposit must be at least ₹1');
    }
    return true;
  }),
  body('minWithdraw').custom((value, { req }) => {
    const minWithdraw = parseFee(value, 'Minimum withdrawal');
    if (minWithdraw < 1) {
      throw new Error('Minimum withdrawal must be at least ₹1');
    }
    const minDeposit = parseFee(req.body.minDeposit, 'Minimum deposit');
    if (minWithdraw < minDeposit) {
      throw new Error(
        `Minimum withdrawal (₹${minWithdraw}) must be greater than or equal to minimum deposit (₹${minDeposit})`
      );
    }
    return true;
  }),
  body('referralBonus').custom((value) => {
    const bonus = parseFee(value, 'Referral bonus');
    if (bonus < 0) {
      throw new Error('Referral bonus cannot be negative');
    }
    return true;
  }),
  body('currency')
    .trim()
    .toUpperCase()
    .isIn(supportedCurrencyCodes)
    .withMessage(`Currency must be one of: ${supportedCurrencyCodes.join(', ')}`),
  body('supportEmail').trim().isEmail().withMessage('Enter a valid support email address'),
  body('paymentMethods').custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('Select at least one payment method');
    }
    const invalid = value
      .map((method) => String(method).trim())
      .filter((method) => method && !PAYMENT_METHOD_OPTIONS.includes(method));
    if (invalid.length) {
      throw new Error(`Invalid payment method(s): ${invalid.join(', ')}`);
    }
    return true;
  }),
  body('withdrawMethods').custom((value) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('Select at least one withdrawal method');
    }
    const invalid = value
      .map((method) => String(method).trim())
      .filter((method) => method && !WITHDRAW_METHOD_OPTIONS.includes(method));
    if (invalid.length) {
      throw new Error(`Invalid withdrawal method(s): ${invalid.join(', ')}`);
    }
    return true;
  }),
];

const getSettings = async (req, res, next) => {
  try {
    const settings = await getPlatformSettings();
    res.json({
      success: true,
      settings,
      currencies: getSupportedCurrencies(),
      paymentMethodOptions: getPaymentMethodOptions(settings.paymentMethods),
      withdrawMethodOptions: getWithdrawMethodOptions(settings.withdrawMethods),
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const {
      upiId,
      upiPayeeName,
      paymentLabel,
      minEntryFee,
      maxEntryFee,
      minDeposit,
      minWithdraw,
      referralBonus,
      currency,
      supportEmail,
      paymentMethods,
      withdrawMethods,
    } = req.body;

    const settings = await updatePlatformSettings(
      {
        upiId,
        upiPayeeName,
        paymentLabel,
        minEntryFee: Number(minEntryFee),
        maxEntryFee: Number(maxEntryFee),
        minDeposit: Number(minDeposit),
        minWithdraw: Number(minWithdraw),
        referralBonus: Number(referralBonus),
        currency,
        supportEmail,
        paymentMethods: paymentMethods.map((m) => String(m).trim()),
        withdrawMethods: withdrawMethods.map((m) => String(m).trim()),
      },
      req.admin._id
    );

    res.json({
      success: true,
      message: 'Platform settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateSettingsValidation,
};
