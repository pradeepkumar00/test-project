const config = require('config');
const Battle = require('../models/Battle');
const User = require('../models/User');
const { recordTransaction } = require('./paymentService');

const calculatePrize = (entryFee) => {
  const platformFeePercent = config.get('battle.platformFeePercent');
  const totalPool = entryFee * 2;
  const platformFee = Math.round(totalPool * (platformFeePercent / 100) * 100) / 100;
  const winningPrize = Math.round((totalPool - platformFee) * 100) / 100;
  return { totalPool, platformFee, winningPrize };
};

const deductBalance = async (user, amount) => {
  if (user.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  const balanceBefore = user.balance;
  user.balance -= amount;
  user.totalWagered += amount;
  await user.save();
  return balanceBefore;
};

const formatBattle = (battle) => ({
  id: battle._id,
  gameType: battle.gameType,
  entryFee: battle.entryFee,
  winningPrize: battle.winningPrize,
  totalPool: battle.totalPool,
  platformFee: battle.platformFee,
  status: battle.status,
  creator: battle.creator
    ? {
        id: battle.creator._id,
        name: battle.creator.name || battle.creator.mobile,
        mobile: battle.creator.mobile,
      }
    : null,
  joiner: battle.joiner
    ? {
        id: battle.joiner._id,
        name: battle.joiner.name || battle.joiner.mobile,
        mobile: battle.joiner.mobile,
      }
    : null,
  winner: battle.winner || null,
  startedAt: battle.startedAt,
  completedAt: battle.completedAt,
  createdAt: battle.createdAt,
});

const createBattle = async ({ userId, entryFee, gameType = 'ludo-classic' }) => {
  const minFee = config.get('battle.minEntryFee');
  const maxFee = config.get('battle.maxEntryFee');

  if (entryFee < minFee || entryFee > maxFee) {
    throw new Error(`Entry fee must be between ${minFee} and ${maxFee}`);
  }

  const gameTypes = config.get('battle.gameTypes');
  const game = gameTypes.find((g) => g.slug === gameType);
  if (!game) throw new Error('Invalid game type');
  if (game.status !== 'live') throw new Error('This game is not available yet');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const balanceBefore = await deductBalance(user, entryFee);
  const { totalPool, platformFee, winningPrize } = calculatePrize(entryFee);

  const battle = await Battle.create({
    creator: userId,
    gameType,
    entryFee,
    totalPool,
    platformFee,
    winningPrize,
    status: 'open',
  });

  await recordTransaction({
    userId,
    type: 'bet',
    amount: -entryFee,
    balanceBefore,
    balanceAfter: user.balance,
    referenceId: battle._id.toString(),
    description: `Battle created - entry fee ${entryFee}`,
    metadata: { battleId: battle._id, action: 'create_battle' },
  });

  return battle;
};

const joinBattle = async ({ userId, battleId }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status !== 'open') throw new Error('Battle is no longer available');
  if (battle.creator.toString() === userId.toString()) {
    throw new Error('You cannot join your own battle');
  }

  const joiner = await User.findById(userId);
  if (!joiner) throw new Error('User not found');

  const balanceBefore = await deductBalance(joiner, battle.entryFee);

  battle.joiner = userId;
  battle.status = 'running';
  battle.startedAt = new Date();
  await battle.save();

  joiner.gamesPlayed += 1;
  await joiner.save();

  const creator = await User.findById(battle.creator);
  creator.gamesPlayed += 1;
  await creator.save();

  await recordTransaction({
    userId,
    type: 'bet',
    amount: -battle.entryFee,
    balanceBefore,
    balanceAfter: joiner.balance,
    referenceId: battle._id.toString(),
    description: `Joined battle - entry fee ${battle.entryFee}`,
    metadata: { battleId: battle._id, action: 'join_battle' },
  });

  return battle;
};

const completeBattle = async ({ battleId, winnerId }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status !== 'running') throw new Error('Battle is not running');

  const validWinner =
    battle.creator.toString() === winnerId.toString() ||
    battle.joiner.toString() === winnerId.toString();
  if (!validWinner) throw new Error('Winner must be a battle participant');

  const winner = await User.findById(winnerId);
  if (!winner) throw new Error('Winner not found');

  const balanceBefore = winner.balance;
  winner.balance += battle.winningPrize;
  winner.income += battle.winningPrize;
  winner.totalWon += battle.winningPrize;
  winner.gamesWon += 1;
  await winner.save();

  battle.winner = winnerId;
  battle.status = 'completed';
  battle.completedAt = new Date();
  await battle.save();

  await recordTransaction({
    userId: winnerId,
    type: 'win',
    amount: battle.winningPrize,
    balanceBefore,
    balanceAfter: winner.balance,
    referenceId: battle._id.toString(),
    description: `Battle won - prize ${battle.winningPrize}`,
    metadata: { battleId: battle._id },
  });

  return battle;
};

module.exports = {
  calculatePrize,
  createBattle,
  joinBattle,
  completeBattle,
  formatBattle,
};
