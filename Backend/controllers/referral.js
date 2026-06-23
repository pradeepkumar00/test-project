const config = require('config');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const getReferralCode = async (req, res) => {
  const referralLink = `${config.get('appUrl')}/login?refer=${req.user.referralCode}`;

  res.json({
    success: true,
    referral: {
      code: req.user.referralCode,
      link: referralLink,
      bonus: config.get('wallet.referralBonus'),
      totalReferrals: req.user.referralCount,
      totalEarnings: req.user.referralEarnings,
    },
  });
};

const getReferralStats = async (req, res, next) => {
  try {
    const referredUsers = await User.find({ referredBy: req.user._id })
      .select('mobile name createdAt totalDeposited')
      .sort({ createdAt: -1 });

    const bonusTransactions = await Transaction.find({
      user: req.user._id,
      type: 'referral_bonus',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      stats: {
        referralCode: req.user.referralCode,
        totalReferrals: req.user.referralCount,
        totalEarnings: req.user.referralEarnings,
        bonusPerReferral: config.get('wallet.referralBonus'),
      },
      referredUsers,
      bonusHistory: bonusTransactions,
    });
  } catch (error) {
    next(error);
  }
};

const getReferredUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const [users, total] = await Promise.all([
      User.find({ referredBy: req.user._id })
        .select('name mobile createdAt isVerified')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments({ referredBy: req.user._id }),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReferralCode,
  getReferralStats,
  getReferredUsers,
};
