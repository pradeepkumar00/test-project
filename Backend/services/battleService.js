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
 */
const getPlayerPlatformFeeShare = (entryFee) => {
  const platformFeePercent = Number(config.get('battle.platformFeePercent')) || 0;
  return Math.round(entryFee * (platformFeePercent / 100) * 100) / 100;
};

const deductEntryFee = async (user, amount, platformFeeShare = 0) => {
  const main = Number(user.balance) || 0;
  const bonus = Number(user.bonusBalance) || 0;
  const feeShare = Math.min(Math.max(0, Number(platformFeeShare) || 0), amount);

  const balanceBefore = main;
  const bonusBefore = bonus;

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
    id: id?.toString?.() || id,
    name: user.name || user.mobile || 'Player',
    mobile: user.mobile || '',
  };
};

const getStartTimeoutMs = () => {
  const minutes = config.has('battle.startTimeoutMinutes')
    ? Number(config.get('battle.startTimeoutMinutes'))
    : 4;
  return Math.max(1, minutes) * 60 * 1000;
};

const formatBattle = (battle) => {
  const startTimeoutMs = getStartTimeoutMs();
  let startDeadlineAt = null;
  if (battle.status === 'matched' && battle.matchedAt) {
    startDeadlineAt = new Date(new Date(battle.matchedAt).getTime() + startTimeoutMs).toISOString();
  }

  return {
    id: battle._id,
    gameType: battle.gameType,
    entryFee: battle.entryFee,
    winningPrize: battle.winningPrize,
    totalPool: battle.totalPool,
    platformFee: battle.platformFee,
    status: battle.status,
    isChallenge: Boolean(battle.challengedUser),
    roomCode: battle.roomCode || null,
    roomCodeSetAt: battle.roomCodeSetAt || null,
    resultScreenshotUrl: battle.resultScreenshotUrl || null,
    // Normalize claim subdocs so UI always sees plain objects
    creatorClaim: battle.creatorClaim
      ? {
          result: battle.creatorClaim.result || null,
          screenshotUrl: battle.creatorClaim.screenshotUrl || null,
          reportedAt: battle.creatorClaim.reportedAt || null,
        }
      : null,
    joinerClaim: battle.joinerClaim
      ? {
          result: battle.joinerClaim.result || null,
          screenshotUrl: battle.joinerClaim.screenshotUrl || null,
          reportedAt: battle.joinerClaim.reportedAt || null,
        }
      : null,
    claimedWinner: battle.claimedWinner
      ? battle.claimedWinner._id
        ? formatPlayer(battle.claimedWinner)
        : formatPlayer(battle.claimedWinner)
      : null,
    creator: formatPlayer(battle.creator),
    joiner: formatPlayer(battle.joiner),
    challengedUser: formatPlayer(battle.challengedUser),
    winner: battle.winner
      ? battle.winner._id
        ? formatPlayer(battle.winner)
        : typeof battle.winner === 'object'
          ? formatPlayer(battle.winner)
          : { id: String(battle.winner), name: '', mobile: '' }
      : null,
    rejectReason: battle.rejectReason || null,
    resultConflict: Boolean(battle.resultConflict),
    conflictType: battle.conflictType || null,
    conflictNote: battle.conflictNote || null,
    matchedAt: battle.matchedAt || null,
    startDeadlineAt,
    startTimeoutMinutes: Math.round(startTimeoutMs / 60000),
    startedAt: battle.startedAt,
    completedAt: battle.completedAt,
    cancelledAt: battle.cancelledAt || null,
    cancelReason: battle.cancelReason || null,
    createdAt: battle.createdAt,
  };
};

/** Statuses that count as "already in a battle" (one at a time). */
const ACTIVE_BATTLE_STATUSES = ['open', 'matched', 'running', 'pending_verification'];

const findActiveBattleForUser = async (userId) => {
  return Battle.findOne({
    status: { $in: ACTIVE_BATTLE_STATUSES },
    $or: [{ creator: userId }, { joiner: userId }],
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate('creator', 'name mobile')
    .populate('joiner', 'name mobile')
    .populate('challengedUser', 'name mobile');
};

const assertNoActiveBattle = async (
  userId,
  message = 'You already have an active battle. Finish or cancel it before starting another.'
) => {
  const active = await findActiveBattleForUser(userId);
  if (active) {
    const err = new Error(message);
    err.code = 'ACTIVE_BATTLE';
    err.activeBattleId = active._id.toString();
    throw err;
  }
};

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

  await assertNoActiveBattle(userId);

  let challengedUser = null;
  if (challengedUserId) {
    if (challengedUserId.toString() === userId.toString()) {
      throw new Error('You cannot challenge yourself');
    }
    challengedUser = await User.findById(challengedUserId);
    if (!challengedUser) throw new Error('Player not found');
    if (!challengedUser.isActive) {
      throw new Error('This player is not available for challenges');
    }
    await assertNoActiveBattle(
      challengedUser._id,
      'This player is already in another battle'
    );
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
      : `Battle created - entry fee ${entryFee}`,
    metadata: {
      battleId: battle._id,
      action: challengedUser ? 'create_challenge' : 'create_battle',
      fromBonus: deduction.fromBonus,
      fromMain: deduction.fromMain,
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

  await assertNoActiveBattle(userId);

  const joiner = await User.findById(userId);
  if (!joiner) throw new Error('User not found');

  const playerFeeShare = getPlayerPlatformFeeShare(battle.entryFee);
  const deduction = await deductEntryFee(joiner, battle.entryFee, playerFeeShare);

  battle.joiner = userId;
  battle.status = 'matched';
  battle.matchedAt = new Date();
  battle.joinerDeduction = {
    fromBonus: deduction.fromBonus,
    fromMain: deduction.fromMain,
  };
  await battle.save();

  await recordTransaction({
    userId,
    type: 'bet',
    amount: -battle.entryFee,
    balanceBefore: deduction.balanceBefore,
    balanceAfter: deduction.balanceAfter,
    referenceId: battle._id.toString(),
    description: `Joined battle - entry fee ${battle.entryFee}`,
    metadata: {
      battleId: battle._id,
      action: 'join_battle',
      fromBonus: deduction.fromBonus,
      fromMain: deduction.fromMain,
    },
  });

  await publishWalletUpdate(joiner, 'battle_entry');
  return battle;
};

const startBattle = async ({ userId, battleId, roomCode }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status !== 'matched') throw new Error('Battle is not ready to start');
  if (battle.creator.toString() !== userId.toString()) {
    throw new Error('Only the battle creator can start and share the room code');
  }

  const code = String(roomCode || '').trim();
  if (!code || code.length < 4 || code.length > 20) {
    throw new Error('Enter a valid Ludo King room code (4–20 characters)');
  }

  battle.roomCode = code;
  battle.roomCodeSetAt = new Date();
  battle.status = 'running';
  battle.startedAt = new Date();
  await battle.save();

  const [creator, joiner] = await Promise.all([
    User.findById(battle.creator),
    User.findById(battle.joiner),
  ]);
  if (creator) {
    creator.gamesPlayed = (creator.gamesPlayed || 0) + 1;
    await creator.save();
  }
  if (joiner) {
    joiner.gamesPlayed = (joiner.gamesPlayed || 0) + 1;
    await joiner.save();
  }

  return battle;
};

const assertParticipant = (battle, userId) => {
  const id = userId.toString();
  const isCreator = battle.creator.toString() === id;
  const isJoiner = battle.joiner && battle.joiner.toString() === id;
  if (!isCreator && !isJoiner) {
    throw new Error('You are not a participant in this battle');
  }
  return { isCreator, isJoiner };
};

const refundUser = async (userId, amount, battleId, reason, split = null) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const fromBonus = Math.min(Number(split?.fromBonus) || 0, amount);
  const fromMain = Math.max(0, amount - fromBonus);

  const balanceBefore = user.balance;

  user.balance = Math.round((user.balance + fromMain) * 100) / 100;
  user.bonusBalance = Math.round((user.bonusBalance + fromBonus) * 100) / 100;
  await user.save();

  await recordTransaction({
    userId: user._id,
    type: 'refund',
    amount,
    balanceBefore,
    balanceAfter: user.balance,
    referenceId: battleId.toString(),
    description: reason,
    metadata: {
      battleId,
      action: 'battle_refund',
      fromBonus,
      fromMain,
      bonusAfter: user.bonusBalance,
    },
  });

  await publishWalletUpdate(user, 'battle_refund');
  return user;
};

const cancelBattle = async (battleId, reason = 'Cancelled by admin') => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');

  if (['completed', 'cancelled'].includes(battle.status)) {
    throw new Error(`Battle is already ${battle.status}`);
  }

  if (battle.status === 'open') {
    await refundUser(
      battle.creator,
      battle.entryFee,
      battle._id,
      `${reason} - creator refund`,
      battle.creatorDeduction
    );
  }

  if (['matched', 'running', 'pending_verification'].includes(battle.status)) {
    await refundUser(
      battle.creator,
      battle.entryFee,
      battle._id,
      `${reason} - creator refund`,
      battle.creatorDeduction
    );
    if (battle.joiner) {
      await refundUser(
        battle.joiner,
        battle.entryFee,
        battle._id,
        `${reason} - joiner refund`,
        battle.joinerDeduction
      );
    }
  }

  battle.status = 'cancelled';
  battle.cancelReason = reason;
  battle.cancelledAt = new Date();
  await battle.save();

  return battle;
};

/** Cancel matched battles that were never started within the start timeout (refund both). */
const expireStaleMatchedBattles = async () => {
  const cutoff = new Date(Date.now() - getStartTimeoutMs());
  const stale = await Battle.find({
    status: 'matched',
    matchedAt: { $lte: cutoff },
  }).limit(25);

  const cancelled = [];
  for (const battle of stale) {
    try {
      cancelled.push(
        await cancelBattle(battle._id, 'Battle cancelled — not started in time. Entry fees refunded.')
      );
    } catch {
      // skip races / already cancelled
    }
  }
  return cancelled;
};

const reportBattleResult = async ({ userId, battleId, result, screenshotUrl = null }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (!['running', 'pending_verification'].includes(battle.status)) {
    throw new Error(
      battle.status === 'matched'
        ? 'Wait for the creator to start and share the room code'
        : 'Results can only be reported for a running battle'
    );
  }

  const { isCreator } = assertParticipant(battle, userId);
  const claimKey = isCreator ? 'creatorClaim' : 'joinerClaim';

  if (!['won', 'lost', 'cancel'].includes(result)) {
    throw new Error('Invalid result');
  }

  if (battle[claimKey]?.result) {
    throw new Error('You already submitted your result for this battle');
  }

  if (result === 'won') {
    const shot = screenshotUrl || battle[claimKey]?.screenshotUrl;
    if (!shot) throw new Error('Upload a screenshot to claim a win');
    battle.set(claimKey, { result: 'won', screenshotUrl: shot, reportedAt: new Date() });
  } else if (result === 'lost') {
    battle.set(claimKey, { result: 'lost', screenshotUrl: null, reportedAt: new Date() });
  } else {
    battle.set(claimKey, { result: 'cancel', screenshotUrl: null, reportedAt: new Date() });
  }

  battle.markModified(claimKey);
  return resolveBattleClaims(battle);
};

/**
 * Resolve creator + joiner claims into a status.
 *
 * Matrix (both sides submitted):
 * - won + lost  → pending_verification (admin pays after checking screenshot)
 * - won + won   → pending_verification CONFLICT (admin picks winner)
 * - won + cancel→ pending_verification CONFLICT
 * - lost + lost → cancel + refund
 * - cancel+cancel→ cancel + refund
 * - lost + cancel→ cancel + refund
 * Single win claim → pending_verification (admin queue; opponent can still submit)
 */
const resolveBattleClaims = async (battle) => {
  const creatorResult = battle.creatorClaim?.result || null;
  const joinerResult = battle.joinerClaim?.result || null;
  const creatorShot = battle.creatorClaim?.screenshotUrl || null;
  const joinerShot = battle.joinerClaim?.screenshotUrl || null;

  const setPending = ({ conflict, type, note, claimedWinnerId, screenshotUrl }) => {
    battle.status = 'pending_verification';
    battle.resultConflict = Boolean(conflict);
    battle.conflictType = type;
    battle.conflictNote = note;
    battle.claimedWinner = claimedWinnerId || null;
    battle.resultScreenshotUrl = screenshotUrl || battle.resultScreenshotUrl || null;
    battle.rejectReason = null;
  };

  // --- only one side submitted ---
  if (creatorResult && !joinerResult) {
    if (creatorResult === 'won') {
      setPending({
        conflict: false,
        type: 'single_win',
        note: 'Creator claimed win. Waiting for joiner result / admin verification.',
        claimedWinnerId: battle.creator,
        screenshotUrl: creatorShot,
      });
    }
    // lost / cancel alone → stay running (or keep pending if already pending from nowhere)
    await battle.save();
    return battle;
  }

  if (joinerResult && !creatorResult) {
    if (joinerResult === 'won') {
      setPending({
        conflict: false,
        type: 'single_win',
        note: 'Joiner claimed win. Waiting for creator result / admin verification.',
        claimedWinnerId: battle.joiner,
        screenshotUrl: joinerShot,
      });
    }
    await battle.save();
    return battle;
  }

  // --- both submitted ---
  if (creatorResult === 'lost' && joinerResult === 'lost') {
    await battle.save();
    return cancelBattle(battle._id, 'Both players reported a loss — entry fees refunded');
  }

  if (creatorResult === 'cancel' && joinerResult === 'cancel') {
    await battle.save();
    return cancelBattle(battle._id, 'Both players cancelled — entry fees refunded');
  }

  if (
    (creatorResult === 'lost' && joinerResult === 'cancel') ||
    (creatorResult === 'cancel' && joinerResult === 'lost')
  ) {
    await battle.save();
    return cancelBattle(
      battle._id,
      'One player cancelled and the other reported a loss — entry fees refunded'
    );
  }

  if (creatorResult === 'won' && joinerResult === 'won') {
    setPending({
      conflict: true,
      type: 'both_won',
      note: 'Conflict: both players claimed win. Review both screenshots and pick the winner.',
      claimedWinnerId: null,
      screenshotUrl: creatorShot || joinerShot,
    });
    await battle.save();
    return battle;
  }

  if (
    (creatorResult === 'won' && joinerResult === 'cancel') ||
    (creatorResult === 'cancel' && joinerResult === 'won')
  ) {
    const winnerId = creatorResult === 'won' ? battle.creator : battle.joiner;
    const shot = creatorResult === 'won' ? creatorShot : joinerShot;
    setPending({
      conflict: true,
      type: 'win_vs_cancel',
      note: 'Conflict: one player claimed win, the other requested cancel. Admin must decide (pay or refund).',
      claimedWinnerId: winnerId,
      screenshotUrl: shot,
    });
    await battle.save();
    return battle;
  }

  if (
    (creatorResult === 'won' && joinerResult === 'lost') ||
    (creatorResult === 'lost' && joinerResult === 'won')
  ) {
    const winnerId = creatorResult === 'won' ? battle.creator : battle.joiner;
    const shot = creatorResult === 'won' ? creatorShot : joinerShot;
    setPending({
      conflict: false,
      type: 'agreed_win_loss',
      note: 'Players agree on the winner. Verify the screenshot, then approve payout.',
      claimedWinnerId: winnerId,
      screenshotUrl: shot,
    });
    await battle.save();
    return battle;
  }

  await battle.save();
  return battle;
};

const completeBattle = async ({ battleId, winnerId, adminId = null }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (!['running', 'matched', 'pending_verification'].includes(battle.status)) {
    throw new Error('Battle cannot be completed');
  }

  const validWinner =
    battle.creator.toString() === winnerId.toString() ||
    (battle.joiner && battle.joiner.toString() === winnerId.toString());
  if (!validWinner) throw new Error('Winner must be a battle participant');

  const winner = await User.findById(winnerId);
  if (!winner) throw new Error('Winner not found');

  const loserId =
    battle.creator.toString() === winnerId.toString() ? battle.joiner : battle.creator;
  const loser = loserId ? await User.findById(loserId) : null;

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
  battle.resultConflict = false;
  battle.conflictType = undefined;
  battle.conflictNote = null;
  if (adminId) {
    battle.verifiedBy = adminId;
    battle.verifiedAt = new Date();
  }
  await battle.save();

  await recordTransaction({
    userId: winnerId,
    type: 'win',
    amount: battle.winningPrize,
    balanceBefore,
    balanceAfter: winner.balance,
    referenceId: battle._id.toString(),
    description: `Battle won - prize ${battle.winningPrize}`,
    metadata: { battleId: battle._id, verifiedBy: adminId },
  });

  await publishWalletUpdate(winner, 'battle_win');
  if (loser) await publishWalletUpdate(loser, 'battle_loss');

  return battle;
};

const verifyBattleResult = async ({ battleId, approve, winnerId, adminId, reason }) => {
  const battle = await Battle.findById(battleId);
  if (!battle) throw new Error('Battle not found');
  if (battle.status !== 'pending_verification') {
    throw new Error('Battle is not pending verification');
  }

  if (!approve) {
    battle.status = 'running';
    battle.claimedWinner = null;
    battle.resultScreenshotUrl = null;
    battle.creatorClaim = { result: undefined, screenshotUrl: null };
    battle.joinerClaim = { result: undefined, screenshotUrl: null };
    battle.resultConflict = false;
    battle.conflictType = undefined;
    battle.conflictNote = null;
    battle.rejectReason = reason || 'Result rejected by admin — submit again';
    battle.verifiedBy = adminId;
    battle.verifiedAt = new Date();
    battle.markModified('creatorClaim');
    battle.markModified('joinerClaim');
    await battle.save();
    return battle;
  }

  // Conflict with no default winner — admin must pick
  const finalWinnerId = winnerId || battle.claimedWinner;
  if (!finalWinnerId) {
    throw new Error('Select a winner to approve (required when both claimed win)');
  }

  return completeBattle({ battleId, winnerId: finalWinnerId, adminId });
};

module.exports = {
  calculatePrize,
  getPlayerPlatformFeeShare,
  deductEntryFee,
  createBattle,
  joinBattle,
  startBattle,
  reportBattleResult,
  completeBattle,
  verifyBattleResult,
  cancelBattle,
  refundUser,
  expireStaleMatchedBattles,
  getStartTimeoutMs,
  formatBattle,
  findActiveBattleForUser,
  ACTIVE_BATTLE_STATUSES,
};
