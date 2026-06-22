const Deposit = require('../../models/Deposit');
const Withdraw = require('../../models/Withdraw');
const Battle = require('../../models/Battle');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

const getDashboard = async (req, res, next) => {
  try {
    const [
      pendingDeposits,
      pendingWithdrawals,
      openBattles,
      runningBattles,
      totalUsers,
      totalDeposits,
      totalWithdrawals,
    ] = await Promise.all([
      Deposit.countDocuments({ status: 'pending' }),
      Withdraw.countDocuments({ status: 'pending' }),
      Battle.countDocuments({ status: 'open' }),
      Battle.countDocuments({ status: 'running' }),
      User.countDocuments({ role: 'user' }),
      Deposit.countDocuments({ status: { $in: ['approved', 'completed'] } }),
      Withdraw.countDocuments({ status: 'completed' }),
    ]);

    res.json({
      success: true,
      stats: {
        pendingDeposits,
        pendingWithdrawals,
        openBattles,
        runningBattles,
        totalUsers,
        totalDeposits,
        totalWithdrawals,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
