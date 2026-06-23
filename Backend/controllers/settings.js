const config = require('config');

const getSettings = (req, res) => {
  res.json({
    success: true,
    settings: {
      appName: config.get('appName'),
      currency: config.get('currency'),
      currencySymbol: config.get('currencySymbol'),
      minDeposit: config.get('wallet.minDeposit'),
      minWithdraw: config.get('wallet.minWithdraw'),
      referralBonus: config.get('wallet.referralBonus'),
      paymentMethods: config.get('paymentMethods'),
      withdrawMethods: config.get('withdrawMethods'),
      colorMultipliers: config.get('colorMultipliers'),
      numberMultipliers: config.get('numberMultipliers'),
      supportEmail: config.get('supportEmail'),
    },
  });
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'BigFun API is running',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getSettings, healthCheck };
