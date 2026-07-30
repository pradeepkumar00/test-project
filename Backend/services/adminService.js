const Battle = require('../models/Battle');
const User = require('../models/User');
const Withdraw = require('../models/Withdraw');
const Transaction = require('../models/Transaction');
const { recordTransaction } = require('./paymentService');
const { publishWalletUpdate } = require('./firebaseService');
const { formatBattle, cancelBattle } = require('./battleService');

const deleteBattle = async (battleId) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');

  if (!['cancelled', 'completed'].includes(battle.status)) {
    throw new Error('Cancel the battle before deleting');
  }

  await Battle.deleteOne({ _id: battleId });
  return { id: battleId, deleted: true };
};

const approveWithdrawal = async (withdrawId, adminId) => {
  const withdraw = await Withdraw.findById(withdrawId);
  if (!withdraw) throw new Error('Withdrawal not found');
  if (withdraw.status !== 'pending') throw new Error(`Withdrawal already ${withdraw.status}`);

  withdraw.status = 'completed';
  withdraw.processedAt = new Date();
  withdraw.metadata = { ...withdraw.metadata, approvedBy: adminId };
  await withdraw.save();

  const Transaction = require('../models/Transaction');
  await Transaction.findOneAndUpdate(
    { referenceId: withdraw._id.toString(), type: 'withdraw' },
    { status: 'completed' }
  );

  return withdraw;
};

const rejectWithdrawal = async (withdrawId, reason, adminId) => {
  const withdraw = await Withdraw.findById(withdrawId);
  if (!withdraw) throw new Error('Withdrawal not found');
  if (withdraw.status !== 'pending') throw new Error(`Withdrawal already ${withdraw.status}`);

  const user = await User.findById(withdraw.user);
  if (!user) throw new Error('User not found');

  const balanceBefore = user.balance;
  user.balance += withdraw.amount;
  user.totalWithdrawn -= withdraw.amount;
  await user.save();

  withdraw.status = 'rejected';
  withdraw.rejectReason = reason.trim();
  withdraw.processedAt = new Date();
  withdraw.metadata = { ...withdraw.metadata, rejectedBy: adminId };
  await withdraw.save();

  await recordTransaction({
    userId: user._id,
    type: 'refund',
    amount: withdraw.amount,
    balanceBefore,
    balanceAfter: user.balance,
    referenceId: withdraw._id.toString(),
    description: `Withdrawal rejected - ${reason || 'refunded to wallet'}`,
    metadata: { withdrawId: withdraw._id },
  });

  const Transaction = require('../models/Transaction');
  await Transaction.findOneAndUpdate(
    { referenceId: withdraw._id.toString(), type: 'withdraw' },
    { status: 'cancelled' }
  );

  await publishWalletUpdate(user, 'withdrawal_rejected', { withdrawId: withdraw._id.toString() });

  return { withdraw, user };
};

module.exports = {
  cancelBattle,
  deleteBattle,
  approveWithdrawal,
  rejectWithdrawal,
  formatBattle,
};
