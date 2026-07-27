const { sanitizeUser } = require('../utils/helpers');
const Battle = require('../models/Battle');
const { getRedis } = require('../config/redis');
const { sendAadhaarOtp, verifyAadhaarOtp } = require('../services/aadhaarKycService');

const aadhaarOtpSessionKey = (userId) => `kyc:aadhaar:${userId}`;

const getProfileStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const completed = await Battle.find({
      status: 'completed',
      $or: [{ creator: userId }, { joiner: userId }],
    }).select('entryFee winningPrize winner creator joiner');

    let battlesWon = 0;
    let battlesLost = 0;
    let moneyWon = 0;
    let moneyLost = 0;

    for (const battle of completed) {
      const winnerId = battle.winner?.toString();
      if (winnerId === userId.toString()) {
        battlesWon += 1;
        moneyWon += battle.winningPrize || 0;
      } else if (winnerId) {
        battlesLost += 1;
        moneyLost += battle.entryFee || 0;
      }
    }

    const battlesPlayed = battlesWon + battlesLost;

    res.json({
      success: true,
      profile: {
        ...sanitizeUser(req.user),
        gamesWon: battlesWon,
        gamesLost: battlesLost,
        gamesPlayed: battlesPlayed || req.user.gamesPlayed || 0,
        totalWon: Math.round(moneyWon * 100) / 100,
        totalLost: Math.round(moneyLost * 100) / 100,
        income: req.user.income,
        referralEarnings: req.user.referralEarnings || 0,
        referralCount: req.user.referralCount || 0,
        kycStatus: req.user.kyc?.isVerified ? 'verified' : 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

const sendProfileAadhaarOtp = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.body;
    const normalizedAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
    if (!/^\d{12}$/.test(normalizedAadhaar)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 12-digit Aadhaar number' });
    }

    const result = await sendAadhaarOtp({
      aadhaarNumber: normalizedAadhaar,
      userId: req.user._id.toString(),
      mobile: req.user.mobile,
    });

    if (!result.requestId) {
      const err = new Error('Aadhaar provider did not return a request id');
      err.status = 502;
      throw err;
    }

    const redis = getRedis();
    await redis.set(
      aadhaarOtpSessionKey(req.user._id.toString()),
      JSON.stringify({
        requestId: result.requestId,
        aadhaarNumber: normalizedAadhaar,
      }),
      'EX',
      15 * 60
    );

    res.json({
      success: true,
      message: 'Aadhaar OTP sent successfully',
      requestId: result.requestId,
      maskedMobile: result.maskedMobile || null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyProfileAadhaarOtp = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || '').trim();
    if (!/^\d{4,8}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter a valid Aadhaar OTP' });
    }

    const redis = getRedis();
    const rawSession = await redis.get(aadhaarOtpSessionKey(req.user._id.toString()));
    if (!rawSession) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar OTP session expired. Please send OTP again.',
      });
    }

    const session = JSON.parse(rawSession);
    const result = await verifyAadhaarOtp({
      requestId: session.requestId,
      aadhaarNumber: session.aadhaarNumber,
      otp,
      userId: req.user._id.toString(),
      mobile: req.user.mobile,
    });

    req.user.kyc = {
      ...req.user.kyc,
      aadhaarNumber: session.aadhaarNumber,
      isVerified: true,
    };
    if (!req.user.name && result.verifiedName) {
      req.user.name = result.verifiedName;
    }
    await req.user.save();
    await redis.del(aadhaarOtpSessionKey(req.user._id.toString()));

    res.json({
      success: true,
      message: 'Aadhaar verified successfully',
      kycStatus: 'verified',
      verifiedName: result.verifiedName || req.user.name || null,
    });
  } catch (error) {
    next(error);
  }
};

const submitKyc = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.body;
    const normalizedAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');

    req.user.kyc = {
      ...req.user.kyc,
      aadhaarNumber: normalizedAadhaar || req.user.kyc?.aadhaarNumber,
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

module.exports = {
  getProfileStats,
  sendProfileAadhaarOtp,
  verifyProfileAadhaarOtp,
  submitKyc,
  getHistory,
};
