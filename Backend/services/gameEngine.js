const Game = require('../models/Game');
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const User = require('../models/User');
const { generatePeriod, getNumberColor, getNumberSize } = require('../utils/helpers');
const { recordTransaction } = require('./paymentService');

const COLOR_MULTIPLIERS = { red: 2, green: 2, violet: 4.5 };
const NUMBER_MULTIPLIER = 9;
const SIZE_MULTIPLIER = 2;

const getMultiplier = (betType, selection, game) => {
  if (betType === 'color') return game.multipliers[selection] || COLOR_MULTIPLIERS[selection] || 2;
  if (betType === 'number') return game.multipliers.exact || NUMBER_MULTIPLIER;
  if (betType === 'big_small') return game.multipliers[selection] || SIZE_MULTIPLIER;
  return 2;
};

const isBetWinner = (bet, resultNumber, resultColor, resultSize) => {
  if (bet.betType === 'color') {
    if (bet.selection === resultColor) return true;
    if (bet.selection === 'violet' && (resultNumber === 0 || resultNumber === 5)) return true;
    return false;
  }
  if (bet.betType === 'number') return parseInt(bet.selection, 10) === resultNumber;
  if (bet.betType === 'big_small') return bet.selection === resultSize;
  return false;
};

const createRound = async (game) => {
  const now = new Date();
  const endTime = new Date(now.getTime() + game.durationSeconds * 1000);
  const period = generatePeriod(game.slug, now);

  const existing = await GameRound.findOne({ game: game._id, status: { $in: ['betting', 'locked'] } });
  if (existing) return existing;

  return GameRound.create({
    game: game._id,
    period,
    status: 'betting',
    startTime: now,
    endTime,
  });
};

const lockRound = async (round) => {
  if (round.status !== 'betting') return round;
  round.status = 'locked';
  await round.save();
  return round;
};

const settleRound = async (round) => {
  if (round.status === 'completed') return round;

  const resultNumber = Math.floor(Math.random() * 10);
  const resultColor = getNumberColor(resultNumber);
  const resultSize = getNumberSize(resultNumber);

  round.resultNumber = resultNumber;
  round.resultColor = resultColor;
  round.resultSize = resultSize;
  round.status = 'completed';

  const bets = await Bet.find({ round: round._id, status: 'pending' });
  let totalPayout = 0;

  for (const bet of bets) {
    const won = isBetWinner(bet, resultNumber, resultColor, resultSize);
    if (won) {
      bet.status = 'won';
      bet.payout = bet.amount * bet.multiplier;
      totalPayout += bet.payout;

      const user = await User.findById(bet.user);
      if (user) {
        const balanceBefore = user.balance;
        user.balance += bet.payout;
        user.totalWon += bet.payout;
        await user.save();

        await recordTransaction({
          userId: user._id,
          type: 'win',
          amount: bet.payout,
          balanceBefore,
          balanceAfter: user.balance,
          referenceId: bet._id.toString(),
          description: `Won bet on period ${bet.period}`,
          metadata: { betId: bet._id, period: bet.period, selection: bet.selection },
        });
      }
    } else {
      bet.status = 'lost';
      bet.payout = 0;
    }
    bet.settledAt = new Date();
    await bet.save();
  }

  round.totalBets = bets.length;
  round.totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
  round.totalPayout = totalPayout;
  await round.save();

  return round;
};

const placeBet = async ({ userId, gameId, roundId, betType, selection, amount }) => {
  const game = await Game.findById(gameId);
  if (!game || !game.isActive) throw new Error('Game not found or inactive');

  const round = await GameRound.findById(roundId);
  if (!round || round.game.toString() !== gameId.toString()) throw new Error('Invalid round');
  if (round.status !== 'betting') throw new Error('Betting closed for this round');
  if (new Date() >= round.endTime) throw new Error('Round has ended');

  if (amount < game.minBet || amount > game.maxBet) {
    throw new Error(`Bet amount must be between ${game.minBet} and ${game.maxBet}`);
  }

  const validColors = ['red', 'green', 'violet'];
  const validSizes = ['big', 'small'];

  if (betType === 'color' && !validColors.includes(selection)) {
    throw new Error('Invalid color selection');
  }
  if (betType === 'number' && (isNaN(selection) || selection < 0 || selection > 9)) {
    throw new Error('Number must be between 0 and 9');
  }
  if (betType === 'big_small' && !validSizes.includes(selection)) {
    throw new Error('Invalid size selection');
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const totalBalance = user.balance + user.bonusBalance;
  if (totalBalance < amount) throw new Error('Insufficient balance');

  const balanceBefore = user.balance;
  let deductedFromBonus = 0;

  if (user.bonusBalance >= amount) {
    deductedFromBonus = amount;
    user.bonusBalance -= amount;
  } else {
    deductedFromBonus = user.bonusBalance;
    const fromMain = amount - user.bonusBalance;
    user.bonusBalance = 0;
    user.balance -= fromMain;
  }

  user.totalWagered += amount;
  await user.save();

  const multiplier = getMultiplier(betType, selection, game);

  const bet = await Bet.create({
    user: userId,
    game: gameId,
    round: roundId,
    period: round.period,
    betType,
    selection: String(selection),
    amount,
    multiplier,
    status: 'pending',
  });

  await recordTransaction({
    userId,
    type: 'bet',
    amount: -amount,
    balanceBefore,
    balanceAfter: user.balance,
    referenceId: bet._id.toString(),
    description: `Bet on ${game.name} - ${selection}`,
    metadata: { betId: bet._id, period: round.period, betType, selection, deductedFromBonus },
  });

  return bet;
};

const runGameScheduler = async () => {
  const games = await Game.find({ isActive: true });

  for (const game of games) {
    const activeRound = await GameRound.findOne({
      game: game._id,
      status: { $in: ['betting', 'locked'] },
    }).sort({ createdAt: -1 });

    const now = new Date();

    if (!activeRound) {
      await createRound(game);
      continue;
    }

    const lockTime = new Date(activeRound.endTime.getTime() - 5000);

    if (activeRound.status === 'betting' && now >= lockTime) {
      await lockRound(activeRound);
    }

    if (now >= activeRound.endTime) {
      await settleRound(activeRound);
      await createRound(game);
    }
  }
};

module.exports = {
  createRound,
  lockRound,
  settleRound,
  placeBet,
  runGameScheduler,
  getMultiplier,
  isBetWinner,
};
