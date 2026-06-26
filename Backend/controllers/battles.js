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
];

const createBattleHandler = async (req, res) => {
  try {
    const { entryFee, gameType = 'ludo-classic' } = req.body;
    const battle = await createBattle({
      userId: req.user._id,
      entryFee: parseFloat(entryFee),
      gameType,
    });

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile');

    const user = await User.findById(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Battle created successfully',
      battle: formatBattle(populated),
      balance: user.balance,
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

    const filter = { status: 'open' };
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
      .populate('joiner', 'name mobile');

    res.json({
      success: true,
      message: 'Battle joined! Game is now running.',
      battle: formatBattle(populated),
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
  joinBattleHandler,
  completeBattleHandler,
  getMyBattles,
  previewPrize,
};
