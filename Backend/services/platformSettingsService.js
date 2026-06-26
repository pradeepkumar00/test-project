const config = require('config');
const PlatformSettings = require('../models/PlatformSettings');

const SETTINGS_ID = 'platform';
const CACHE_TTL_MS = 30_000;

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  MYR: 'RM',
  BDT: '৳',
  NPR: 'रू',
  PKR: '₨',
};

const PAYMENT_METHOD_OPTIONS = ['UPI', 'Paytm', 'PhonePe', 'Google Pay', 'Bank Transfer', 'IMPS', 'NEFT'];
const WITHDRAW_METHOD_OPTIONS = ['UPI', 'Bank Transfer', 'IMPS', 'NEFT'];

let cache = null;
let cacheExpiry = 0;

const getConfigDefaults = () => ({
  upiId: config.get('wallet.upiId'),
  upiPayeeName:
    config.has('wallet.upiPayeeName')
      ? config.get('wallet.upiPayeeName')
      : config.has('wallet.upiPayeename')
        ? config.get('wallet.upiPayeename')
        : config.get('appName'),
  paymentLabel: config.get('wallet.paymentLabel'),
  minEntryFee: config.get('battle.minEntryFee'),
  maxEntryFee: config.get('battle.maxEntryFee'),
  minDeposit: config.get('wallet.minDeposit'),
  minWithdraw: config.get('wallet.minWithdraw'),
  referralBonus: config.get('wallet.referralBonus'),
  currency: config.get('currency'),
  currencySymbol: config.get('currencySymbol'),
  supportEmail: config.get('supportEmail'),
  paymentMethods: [...config.get('paymentMethods')],
  withdrawMethods: [...config.get('withdrawMethods')],
});

const toSettings = (doc) => {
  const defaults = getConfigDefaults();
  if (!doc) return defaults;

  return {
    upiId: doc.upiId ?? defaults.upiId,
    upiPayeeName: doc.upiPayeeName ?? defaults.upiPayeeName,
    paymentLabel: doc.paymentLabel ?? defaults.paymentLabel,
    minEntryFee: doc.minEntryFee ?? defaults.minEntryFee,
    maxEntryFee: doc.maxEntryFee ?? defaults.maxEntryFee,
    minDeposit: doc.minDeposit ?? defaults.minDeposit,
    minWithdraw: doc.minWithdraw ?? defaults.minWithdraw,
    referralBonus: doc.referralBonus ?? defaults.referralBonus,
    currency: doc.currency ?? defaults.currency,
    currencySymbol: doc.currencySymbol ?? defaults.currencySymbol,
    supportEmail: doc.supportEmail ?? defaults.supportEmail,
    paymentMethods: doc.paymentMethods?.length ? doc.paymentMethods : defaults.paymentMethods,
    withdrawMethods: doc.withdrawMethods?.length ? doc.withdrawMethods : defaults.withdrawMethods,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
};

const getPlatformSettings = async (forceRefresh = false) => {
  if (!forceRefresh && cache && Date.now() < cacheExpiry) {
    return cache;
  }

  let doc = await PlatformSettings.findById(SETTINGS_ID);
  if (!doc) {
    doc = await PlatformSettings.create({ _id: SETTINGS_ID, ...getConfigDefaults() });
  }

  cache = toSettings(doc);
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cache;
};

const getSupportedCurrencies = () =>
  Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => ({ code, symbol }));

const mergeMethodOptions = (defaults, current = []) => [...new Set([...defaults, ...current])];

const getPaymentMethodOptions = (current = []) => mergeMethodOptions(PAYMENT_METHOD_OPTIONS, current);

const getWithdrawMethodOptions = (current = []) => mergeMethodOptions(WITHDRAW_METHOD_OPTIONS, current);

const updatePlatformSettings = async (updates, adminId) => {
  const current = await getPlatformSettings(true);
  const next = { ...current, ...updates };

  if (next.minEntryFee > next.maxEntryFee) {
    throw new Error('Minimum entry fee cannot exceed maximum entry fee');
  }

  if (next.minWithdraw < next.minDeposit) {
    throw new Error('Minimum withdrawal cannot be less than minimum deposit');
  }

  if (updates.currency) {
    next.currency = updates.currency.toUpperCase();
    next.currencySymbol = CURRENCY_SYMBOLS[next.currency] || next.currency;
  }

  const doc = await PlatformSettings.findByIdAndUpdate(
    SETTINGS_ID,
    {
      $set: {
        upiId: next.upiId,
        upiPayeeName: next.upiPayeeName,
        paymentLabel: next.paymentLabel,
        minEntryFee: next.minEntryFee,
        maxEntryFee: next.maxEntryFee,
        minDeposit: next.minDeposit,
        minWithdraw: next.minWithdraw,
        referralBonus: next.referralBonus,
        currency: next.currency,
        currencySymbol: next.currencySymbol,
        supportEmail: next.supportEmail,
        paymentMethods: next.paymentMethods,
        withdrawMethods: next.withdrawMethods,
        updatedBy: adminId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  cache = toSettings(doc);
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cache;
};

const warmPlatformSettingsCache = async () => {
  await getPlatformSettings(true);
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
  getSupportedCurrencies,
  getPaymentMethodOptions,
  getWithdrawMethodOptions,
  warmPlatformSettingsCache,
  CURRENCY_SYMBOLS,
  PAYMENT_METHOD_OPTIONS,
  WITHDRAW_METHOD_OPTIONS,
};
