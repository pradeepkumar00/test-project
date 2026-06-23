const config = require('config');
const { sanitizeUser } = require('../utils/helpers');

const getHome = async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    home: {
      walletBalance: user.balance + user.bonusBalance,
      income: user.income,
      user: sanitizeUser(user),
      kyc: {
        status: user.kyc?.isVerified ? 'verified' : 'pending',
        message: user.kyc?.isVerified
          ? 'KYC completed'
          : 'Verify your account to unlock all features',
      },
      tournaments: config.get('battle.gameTypes'),
      platformFeePercent: config.get('battle.platformFeePercent'),
    },
  });
};

module.exports = { getHome };
