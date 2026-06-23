const { sanitizeUser } = require('../utils/helpers');

const getProfileStats = async (req, res) => {
  res.json({
    success: true,
    profile: {
      ...sanitizeUser(req.user),
      gamesWon: req.user.gamesWon,
      gamesPlayed: req.user.gamesPlayed,
      income: req.user.income,
      kycStatus: req.user.kyc?.isVerified ? 'verified' : 'pending',
    },
  });
};

const submitKyc = async (req, res, next) => {
  try {
    const { panNumber, aadhaarNumber } = req.body;

    req.user.kyc = {
      panNumber: panNumber || req.user.kyc?.panNumber,
      aadhaarNumber: aadhaarNumber || req.user.kyc?.aadhaarNumber,
      isVerified: false,
    };
    await req.user.save();

    res.json({
      success: true,
      message: 'KYC submitted. Admin will verify shortly.',
      kycStatus: 'pending',
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const Transaction = require('../models/Transaction');
    const Battle = require('../models/Battle');

    const [transactions, battles] = await Promise.all([
      Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
      Battle.find({
        $or: [{ creator: req.user._id }, { joiner: req.user._id }],
      })
        .populate('creator', 'name mobile')
        .populate('joiner', 'name mobile')
        .sort({ createdAt: -1 })
        .limit(30),
    ]);

    res.json({ success: true, transactions, battles });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfileStats, submitKyc, getHistory };
