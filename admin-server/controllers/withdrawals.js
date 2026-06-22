const Withdraw = require('../../models/Withdraw');
const { approveWithdrawal, rejectWithdrawal } = require('../../services/adminService');

const listWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const [withdrawals, total] = await Promise.all([
      Withdraw.find(filter)
        .populate('user', 'name mobile balance bankDetails')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Withdraw.countDocuments(filter),
    ]);

    res.json({
      success: true,
      withdrawals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const withdraw = await approveWithdrawal(req.params.id, req.admin._id);
    res.json({ success: true, message: 'Withdrawal approved', withdraw });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await rejectWithdrawal(req.params.id, reason, req.admin._id);
    res.json({
      success: true,
      message: 'Withdrawal rejected and amount refunded',
      withdraw: result.withdraw,
      user: { id: result.user._id, balance: result.user.balance },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { listWithdrawals, approveWithdraw, rejectWithdraw };
