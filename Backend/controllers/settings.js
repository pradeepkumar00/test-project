const config = require('config');
const { getPlatformSettings } = require('../services/platformSettingsService');
const { getRealtimeSyncConfig } = require('../utils/realtimeSyncConfig');

const getSettings = async (req, res, next) => {
  try {
    const platform = await getPlatformSettings();
    res.json({
      success: true,
      settings: {
        appName: config.get('appName'),
        currency: platform.currency,
        currencySymbol: platform.currencySymbol,
        minDeposit: platform.minDeposit,
        minWithdraw: platform.minWithdraw,
        referralBonus: platform.referralBonus,
        minEntryFee: platform.minEntryFee,
        maxEntryFee: platform.maxEntryFee,
        paymentMethods: platform.paymentMethods,
        withdrawMethods: platform.withdrawMethods,
        colorMultipliers: config.get('colorMultipliers'),
        numberMultipliers: config.get('numberMultipliers'),
        supportEmail: platform.supportEmail,
        realtime: getRealtimeSyncConfig(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'BigFun API is running',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getSettings, healthCheck };
