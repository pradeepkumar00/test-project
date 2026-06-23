const { body } = require('express-validator');
const Game = require('../models/Game');
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const { createRound, placeBet } = require('../services/gameEngine');
const { getColorNumbers } = require('../utils/helpers');

const betValidation = [
  body('betType').isIn(['color', 'number', 'big_small']).withMessage('Invalid bet type'),
  body('selection').notEmpty().withMessage('Selection is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Valid bet amount required'),
];

const listGames = async (req, res, next) => {
  try {
    const games = await Game.find({ isActive: true }).select('-__v');
    res.json({ success: true, games });
  } catch (error) {
    next(error);
  }
};

const getGame = async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug, isActive: true });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    res.json({ success: true, game });
  } catch (error) {
    next(error);
  }
};

const getCurrentRound = async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug, isActive: true });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    let round = await GameRound.findOne({
      game: game._id,
      status: { $in: ['betting', 'locked'] },
    }).sort({ createdAt: -1 });

    if (!round) {
      round = await createRound(game);
    }

    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((round.endTime - now) / 1000));

    res.json({
      success: true,
      game: { id: game._id, name: game.name, slug: game.slug, durationSeconds: game.durationSeconds },
      round: {
        id: round._id,
        period: round.period,
        status: round.status,
        startTime: round.startTime,
        endTime: round.endTime,
        timeRemaining,
        resultNumber: round.status === 'completed' ? round.resultNumber : null,
        resultColor: round.status === 'completed' ? round.resultColor : null,
      },
      colorMap: {
        red: getColorNumbers('red'),
        green: getColorNumbers('green'),
        violet: getColorNumbers('violet'),
      },
      multipliers: game.multipliers,
    });
  } catch (error) {
    next(error);
  }
};

const getRoundHistory = async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const rounds = await GameRound.find({ game: game._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('period resultNumber resultColor resultSize endTime totalBets totalAmount');

    res.json({ success: true, rounds });
  } catch (error) {
    next(error);
  }
};

const placeBetHandler = async (req, res, next) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug, isActive: true });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const round = await GameRound.findOne({
      game: game._id,
      status: 'betting',
    }).sort({ createdAt: -1 });

    if (!round) {
      return res.status(400).json({ success: false, message: 'No active betting round' });
    }

    const { betType, selection, amount } = req.body;

    const bet = await placeBet({
      userId: req.user._id,
      gameId: game._id,
      roundId: round._id,
      betType,
      selection,
      amount: parseFloat(amount),
    });

    const user = await require('../models/User').findById(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      bet: {
        id: bet._id,
        period: bet.period,
        betType: bet.betType,
        selection: bet.selection,
        amount: bet.amount,
        multiplier: bet.multiplier,
        status: bet.status,
      },
      balance: {
        main: user.balance,
        bonus: user.bonusBalance,
        total: user.balance + user.bonusBalance,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyBets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const [bets, total] = await Promise.all([
      Bet.find(filter)
        .populate('game', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Bet.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getBetById = async (req, res, next) => {
  try {
    const bet = await Bet.findOne({ _id: req.params.betId, user: req.user._id }).populate('game', 'name slug');
    if (!bet) {
      return res.status(404).json({ success: false, message: 'Bet not found' });
    }
    res.json({ success: true, bet });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  betValidation,
  listGames,
  getGame,
  getCurrentRound,
  getRoundHistory,
  placeBetHandler,
  getMyBets,
  getBetById,
};
