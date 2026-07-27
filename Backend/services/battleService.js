const config = require('config');
const Battle = require('../models/Battle');
const User = require('../models/User');
const { recordTransaction } = require('./paymentService');
const { getPlatformSettings } = require('./platformSettingsService');
const { publishWalletUpdate } = require('./firebaseService');

const calculatePrize = (entryFee) => {
  const platformFeePercent = config.get('battle.platformFeePercent');
  const totalPool = entryFee * 2;
  const platformFee = Math.round(totalPool * (platformFeePercent / 100) * 100) / 100;
  const winningPrize = Math.round((totalPool - platformFee) * 100) / 100;
  return { totalPool, platformFee, winningPrize };
};

/**
 * Charge battle entry fee:
 * - Only the player's platform-fee share may come from referral (bonusBalance)
 * - Remaining entry fee must come from deposited wallet (balance)
 *
 * Example: ₹100 entry at 2.5% → ₹2.50 from referral, ₹97.50 from wallet.
 */
const getPlayerPlatformFeeShare = (entryFee) => {
  const platformFeePercent = Number(config.get('battle.platformFeePercent')) || 0;
  return Math.round(entryFee * (platformFeePercent / 100) * 100) / 100;
};

const deductEntryFee = async (user, amount, platformFeeShare = 0) => {
  const main = Number(user.balance) || 0;
  const bonus = Number(user.bonusBalance) || 0;
  const feeShare = Math.min(Math.max(0, Number(platformFeeShare) || 0), amount);
  const walletPortion = Math.round((amount - feeShare) * 100) / 100;

  const balanceBefore = main;
  const bonusBefore = bonus;

  // Prefer referral only up to platform-fee share; shortfall of fee share falls to wallet.
  const fromBonus = Math.min(bonus, feeShare);
  const fromMain = Math.round((amount - fromBonus) * 100) / 100;

  if (fromMain > main) {
    throw new Error(
      `Insufficient deposit wallet. Need ₹${fromMain} from wallet` +
        (feeShare > 0 ? ` (referral can cover up to ₹${feeShare} platform fee)` : '')
    );
  }

  user.bonusBalance = Math.round((bonus - fromBonus) * 100) / 100;
  user.balance = Math.round((main - fromMain) * 100) / 100;
  user.totalWagered = (user.totalWagered || 0) + amount;
  await user.save();

  return {
    balanceBefore,
    bonusBefore,
    balanceAfter: user.balance,
    bonusAfter: user.bonusBalance,
    fromBonus,
    fromMain,
    platformFeeShare: feeShare,
    walletPortion,
  };
};

const formatPlayer = (user) => {
  if (!user) return null;
  if (typeof user === 'string') {
    return { id: user, name: '', mobile: '' };
  }
  const id = user._id || user.id;
  if (!id && typeof user.toString === 'function') {
    return { id: user.toString(), name: '', mobile: '' };
  }
  return {
    id,
    name: user.name || user.mobile || '',
    mobile: user.mobile || '',
  };
};

const formatBattle = (battle) => ({
  id: battle._id,
  gameType: battle.gameType,
  entryFee: battle.entryFee,
  winningPrize: battle.winningPrize,
  totalPool: battle.totalPool,
  platformFee: battle.platformFee,
  status: battle.status,
  isChallenge: Boolean(battle.challengedUser),
  creator: formatPlayer(battle.creator),
  joiner: formatPlayer(battle.joiner),
  challengedUser: formatPlayer(battle.challengedUser),
  winner: battle.winner
    ? battle.winner._id
      ? formatPlayer(battle.winner)
      : battle.winner
    : null,
  startedAt: battle.startedAt,
  completedAt: battle.completedAt,
  createdAt: battle.createdAt,
});

const createBattle = async ({ userId, entryFee, gameType = 'ludo-classic', challengedUserId = null }) => {
  const platform = await getPlatformSettings();
  const minFee = platform.minEntryFee;
  const maxFee = platform.maxEntryFee;

  if (entryFee < minFee || entryFee > maxFee) {
    throw new Error(`Entry fee must be between ${minFee} and ${maxFee}`);
  }

  const gameTypes = config.get('battle.gameTypes');
  const game = gameTypes.find((g) => g.slug === gameType);
  if (!game) throw new Error('Invalid game type');
  if (game.status !== 'live') throw new Error('This game is not available yet');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  let challengedUser = null;
  if (challengedUserId) {
    if (challengedUserId.toString() === userId.toString()) {
      throw new Error('You cannot challenge yourself');
    }
    challengedUser = await User.findById(challengedUserId);
    if (!challengedUser) {
      throw new Error('Player not found');
    }
    if (!challengedUser.isActive) {
      throw new Error('This player is not available for challenges');
    }
  }

  const { totalPool, platformFee, winningPrize } = calculatePrize(entryFee);
  const playerFeeShare = getPlayerPlatformFeeShare(entryFee);
  const deduction = await deductEntryFee(user, entryFee, playerFeeShare);

  const battle = await Battle.create({
    creator: userId,
    challengedUser: challengedUser ? challengedUser._id : null,
    gameType,
    entryFee,
    totalPool,
    platformFee,
    winningPrize,
    status: 'open',
    creatorDeduction: {
      fromBonus: deduction.fromBonus,
      fromMain: deduction.fromMain,
    },
  });

  await recordTransaction({
    userId,
    type: 'bet',
    amount: -entryFee,
    balanceBefore: deduction.balanceBefore,
    balanceAfter: deduction.balanceAfter,
    referenceId: battle._id.toString(),
    description: challengedUser
      ? `Challenge created vs ${challengedUser.name || challengedUser.mobile} - entry fee ${entryFee}`
      : `Battle created - entry fee ${entryFee} (platform fee referral ₹${deduction.fromBonus}, wallet ₹${deduction.fromMain})`,
    metadata: {
      battleId: battle._id,
      action: challengedUser ? 'create_challenge' : 'create_battle',
      challengedUserId: challengedUser ? challengedUser._id : null,
      fromBonus: deduction.fromBonus,
      fromMain: deduction.fromMain,
      platformFeeShare: deduction.platformFeeShare,
      bonusBefore: deduction.bonusBefore,
      bonusAfter: deduction.bonusAfter,
    },
  });

  await publishWalletUpdate(user, 'battle_entry');

  return battle;
};

const joinBattle = async ({ userId, battleId }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status !== 'open') throw new Error('Battle is no longer available');
  if (battle.creator.toString() === userId.toString()) {
    throw new Error('You cannot join your own battle');
  }
  if (battle.challengedUser && battle.challengedUser.toString() !== userId.toString()) {
    throw new Error('This challenge is for another player');
  }

  const joiner = await User.findById(userId);
  if (!joiner) throw new Error('User not found');

  const playerFeeShare = getPlayerPlatformFeeShare(battle.entryFee);
  const deduction = await deductEntryFee(joiner, battle.entryFee, playerFeeShare);

  battle.joiner = userId;
  battle.status = 'running';
  battle.startedAt = new Date();
  battle.joinerDeduction = {
    fromBonus: deduction.fromBonus,
    fromMain: deduction.fromMain,
  };
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
    balanceBefore: deduction.balanceBefore,
    balanceAfter: deduction.balanceAfter,
    referenceId: battle._id.toString(),
    description: `Joined battle - entry fee ${battle.entryFee} (platform fee referral ₹${deduction.fromBonus}, wallet ₹${deduction.fromMain})`,
    metadata: {
      battleId: battle._id,
      action: 'join_battle',
      fromBonus: deduction.fromBonus,
      fromMain: deduction.fromMain,
      platformFeeShare: deduction.platformFeeShare,
      bonusBefore: deduction.bonusBefore,
      bonusAfter: deduction.bonusAfter,
    },
  });

  await publishWalletUpdate(joiner, 'battle_entry');

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

  const loserId =
    battle.creator.toString() === winnerId.toString() ? battle.joiner : battle.creator;
  const loser = await User.findById(loserId);

  const balanceBefore = winner.balance;
  winner.balance += battle.winningPrize;
  winner.income += battle.winningPrize;
  winner.totalWon += battle.winningPrize;
  winner.gamesWon += 1;
  await winner.save();

  if (loser) {
    loser.gamesLost = (loser.gamesLost || 0) + 1;
    loser.totalLost = Math.round(((loser.totalLost || 0) + battle.entryFee) * 100) / 100;
    await loser.save();
  }

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

  await publishWalletUpdate(winner, 'battle_win');
  if (loser) await publishWalletUpdate(loser, 'battle_loss');

  return battle;
};

module.exports = {
  calculatePrize,
  getPlayerPlatformFeeShare,
  deductEntryFee,
  createBattle,
  joinBattle,
  completeBattle,
  formatBattle,
};
