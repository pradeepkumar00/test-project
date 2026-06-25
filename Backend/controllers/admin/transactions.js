const Transaction = require('../../models/Transaction');

const listTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const type = req.query.type;
    const userId = req.query.userId;

    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('user', 'name mobile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listTransactions };
