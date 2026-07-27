const config = require('config');
const { body } = require('express-validator');
const Battle = require('../models/Battle');
const User = require('../models/User');
const { getPlatformSettings } = require('../services/platformSettingsService');
const {
  createBattle,
  joinBattle,
  completeBattle,
  calculatePrize,
  formatBattle,
} = require('../services/battleService');

const createBattleValidation = [
  body('entryFee').custom(async (value) => {
    const platform = await getPlatformSettings();
    const fee = parseFloat(value);
    if (Number.isNaN(fee)) {
      throw new Error('Entry fee must be a number');
    }
    if (fee < platform.minEntryFee) {
      throw new Error(`Minimum entry fee is ${platform.minEntryFee}`);
    }
    if (fee > platform.maxEntryFee) {
      throw new Error(`Maximum entry fee is ${platform.maxEntryFee}`);
    }
    return true;
  }),
  body('gameType').optional().isString(),
  body('challengedUserId').optional().isMongoId().withMessage('Invalid player id'),
];

const createBattleHandler = async (req, res) => {
  try {
    const { entryFee, gameType = 'ludo-classic', challengedUserId = null } = req.body;
    const battle = await createBattle({
      userId: req.user._id,
      entryFee: parseFloat(entryFee),
      gameType,
      challengedUserId,
    });

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile')
      .populate('challengedUser', 'name mobile');

    const user = await User.findById(req.user._id);

    res.status(201).json({
      success: true,
      message: challengedUserId ? 'Challenge sent successfully' : 'Battle created successfully',
      battle: formatBattle(populated),
      balance: user.balance,
      bonusBalance: user.bonusBalance,
      totalBalance: user.balance + user.bonusBalance,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOpenBattles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const gameType = req.query.gameType;

    // Public open battles only (exclude private challenges)
    const filter = { status: 'open', challengedUser: null };
    if (gameType) filter.gameType = gameType;

    const [battles, total] = await Promise.all([
      Battle.find(filter)
        .populate('creator', 'name mobile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Battle.countDocuments(filter),
    ]);

    res.json({
      success: true,
      battles: battles.map(formatBattle),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getChallenges = async (req, res, next) => {
  try {
    const gameType = req.query.gameType;
    const userId = req.user._id;

    const filter = {
      status: 'open',
      challengedUser: { $ne: null },
      $or: [{ challengedUser: userId }, { creator: userId }],
    };
    if (gameType) filter.gameType = gameType;

    const battles = await Battle.find(filter)
      .populate('creator', 'name mobile')
      .populate('challengedUser', 'name mobile')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      battles: battles.map((b) => ({
        ...formatBattle(b),
        direction:
          b.challengedUser && b.challengedUser._id.toString() === userId.toString()
            ? 'incoming'
            : 'outgoing',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const currentUserId = req.user._id.toString();

    const players = await User.find({
      isActive: true,
    })
      .select('name mobile gamesWon gamesLost gamesPlayed totalWon totalLost')
      .sort({ gamesWon: -1, totalWon: -1, gamesPlayed: -1 })
      .limit(limit)
      .lean();

    const leaderboard = players.map((p, index) => ({
      rank: index + 1,
      id: p._id.toString(),
      name: p.name || p.mobile,
      mobile: p.mobile,
      gamesWon: p.gamesWon || 0,
      gamesLost: p.gamesLost || 0,
      gamesPlayed: p.gamesPlayed || 0,
      earnings: p.totalWon || 0,
      totalLost: p.totalLost || 0,
      isMe: p._id.toString() === currentUserId,
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    next(error);
  }
};

const getRunningBattles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const [battles, total] = await Promise.all([
      Battle.find({ status: 'running' })
        .populate('creator', 'name mobile')
        .populate('joiner', 'name mobile')
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Battle.countDocuments({ status: 'running' }),
    ]);

    res.json({
      success: true,
      battles: battles.map((b) => ({
        ...formatBattle(b),
        title: `Game Play between ${b.creator?.name || b.creator?.mobile} & ${b.joiner?.name || b.joiner?.mobile}`,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const joinBattleHandler = async (req, res) => {
  try {
    const battle = await joinBattle({
      userId: req.user._id,
      battleId: req.params.id,
    });

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile')
      .populate('challengedUser', 'name mobile');

    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Battle joined! Game is now running.',
      battle: formatBattle(populated),
      balance: user?.balance,
      bonusBalance: user?.bonusBalance,
      totalBalance: user ? user.balance + user.bonusBalance : undefined,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const completeBattleHandler = async (req, res) => {
  try {
    const { winnerId } = req.body;
    const battle = await completeBattle({
      battleId: req.params.id,
      winnerId,
    });

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile')
      .populate('winner', 'name mobile');

    res.json({
      success: true,
      message: 'Battle completed',
      battle: formatBattle(populated),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyBattles = async (req, res, next) => {
  try {
    const status = req.query.status;
    const filter = {
      $or: [{ creator: req.user._id }, { joiner: req.user._id }],
    };
    if (status) filter.status = status;

    const battles = await Battle.find(filter)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile')
      .populate('winner', 'name mobile')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, battles: battles.map(formatBattle) });
  } catch (error) {
    next(error);
  }
};

const previewPrize = (req, res) => {
  const entryFee = parseFloat(req.query.entryFee) || 0;
  if (!entryFee) {
    return res.status(400).json({ success: false, message: 'entryFee query param required' });
  }

  const prize = calculatePrize(entryFee);
  res.json({
    success: true,
    entryFee,
    ...prize,
    platformFeePercent: config.get('battle.platformFeePercent'),
  });
};

module.exports = {
  createBattleValidation,
  createBattleHandler,
  getOpenBattles,
  getRunningBattles,
  getChallenges,
  getLeaderboard,
  joinBattleHandler,
  completeBattleHandler,
  getMyBattles,
  previewPrize,
};
