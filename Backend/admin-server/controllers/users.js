const User = require('../../models/User');
const { recordTransaction } = require('../../services/paymentService');

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search;

    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { mobile: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
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

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'user') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      user: { id: user._id, mobile: user.mobile, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

const adjustBalance = async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'user') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balanceBefore = user.balance;
    const parsedAmount = parseFloat(amount);

    if (type === 'credit') {
      user.balance += parsedAmount;
    } else if (type === 'debit') {
      if (user.balance < parsedAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance to debit' });
      }
      user.balance -= parsedAmount;
    } else {
      return res.status(400).json({ success: false, message: 'type must be credit or debit' });
    }

    await user.save();

    await recordTransaction({
      userId: user._id,
      type: 'admin_adjustment',
      amount: type === 'credit' ? parsedAmount : -parsedAmount,
      balanceBefore,
      balanceAfter: user.balance,
      description: reason || `Admin ${type}`,
      metadata: { adminId: req.admin._id, type },
    });

    res.json({
      success: true,
      message: 'Balance adjusted',
      user: { id: user._id, mobile: user.mobile, balance: user.balance },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, getUser, updateUserStatus, adjustBalance };
