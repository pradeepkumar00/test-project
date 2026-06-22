const Transaction = require('../models/Transaction');

const recordTransaction = async ({
  userId,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  status = 'completed',
  paymentMethod,
  referenceId,
  description,
  metadata,
}) =>
  Transaction.create({
    user: userId,
    type,
    amount,
    balanceBefore,
    balanceAfter,
    status,
    paymentMethod,
    referenceId,
    description,
    metadata,
  });

const submitDepositRequest = async ({ userId, amount, utrNumber, paymentMethod = 'UPI' }) => {
  const { generateOrderId } = require('../utils/helpers');
  const Deposit = require('../models/Deposit');

  const existing = await Deposit.findOne({ utrNumber, status: { $in: ['pending', 'approved', 'completed'] } });
  if (existing) {
    throw new Error('This UTR number has already been submitted');
  }

  const orderId = generateOrderId();
  return Deposit.create({
    user: userId,
    amount,
    paymentMethod,
    utrNumber,
    orderId,
    status: 'pending',
  });
};

const completeDeposit = async (deposit, utrNumber, reviewedBy = null) => {
  const User = require('../models/User');

  const user = await User.findById(deposit.user);
  if (!user) throw new Error('User not found');

  const balanceBefore = user.balance;
  user.balance += deposit.amount;
  user.totalDeposited += deposit.amount;
  await user.save();

  deposit.status = reviewedBy ? 'approved' : 'completed';
  deposit.utrNumber = utrNumber || deposit.utrNumber;
  deposit.completedAt = new Date();
  if (reviewedBy) {
    deposit.reviewedBy = reviewedBy;
    deposit.reviewedAt = new Date();
  }
  await deposit.save();

  await recordTransaction({
    userId: user._id,
    type: 'deposit',
    amount: deposit.amount,
    balanceBefore,
    balanceAfter: user.balance,
    paymentMethod: deposit.paymentMethod,
    referenceId: deposit.orderId,
    description: `Deposit approved via ${deposit.paymentMethod}`,
    metadata: { utrNumber: deposit.utrNumber, depositId: deposit._id },
  });

  return { user, deposit };
};

module.exports = { recordTransaction, submitDepositRequest, completeDeposit };
