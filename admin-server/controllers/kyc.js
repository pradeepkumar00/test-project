const User = require('../../models/User');

const listPendingKyc = async (req, res, next) => {
  try {
    const users = await User.find({
      role: 'user',
      'kyc.panNumber': { $exists: true, $ne: '' },
      'kyc.isVerified': false,
    })
      .select('name mobile kyc createdAt')
      .sort({ updatedAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const approveKyc = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.kyc.isVerified = true;
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'KYC approved',
      user: { id: user._id, mobile: user.mobile, kycStatus: 'verified' },
    });
  } catch (error) {
    next(error);
  }
};

const rejectKyc = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.kyc.isVerified = false;
    user.kyc.rejectReason = reason || 'Rejected by admin';
    await user.save();

    res.json({
      success: true,
      message: 'KYC rejected',
      user: { id: user._id, mobile: user.mobile, kycStatus: 'rejected' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPendingKyc, approveKyc, rejectKyc };
