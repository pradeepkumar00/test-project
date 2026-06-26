const Deposit = require('../../models/Deposit');
const { completeDeposit } = require('../../services/paymentService');

const listDeposits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const [deposits, total] = await Promise.all([
      Deposit.find(filter)
        .populate('user', 'name mobile balance')
        .populate('reviewedBy', 'name mobile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Deposit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      deposits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const approveDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit already ${deposit.status}` });
    }

    const result = await completeDeposit(deposit, deposit.utrNumber, req.admin._id);

    res.json({
      success: true,
      message: 'Deposit approved and wallet credited',
      deposit: result.deposit,
      user: { id: result.user._id, mobile: result.user.mobile, balance: result.user.balance },
    });
  } catch (error) {
    next(error);
  }
};

const rejectDeposit = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit already ${deposit.status}` });
    }

    deposit.status = 'rejected';
    deposit.rejectReason = reason.trim();
    deposit.reviewedBy = req.admin._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    res.json({ success: true, message: 'Deposit rejected', deposit });
  } catch (error) {
    next(error);
  }
};

module.exports = { listDeposits, approveDeposit, rejectDeposit };
