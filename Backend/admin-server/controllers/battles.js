const Battle = require('../../models/Battle');
const { cancelBattle, deleteBattle, formatBattle } = require('../../services/adminService');
const { completeBattle } = require('../../services/battleService');

const listBattles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const [battles, total] = await Promise.all([
      Battle.find(filter)
        .populate('creator', 'name mobile')
        .populate('joiner', 'name mobile')
        .populate('winner', 'name mobile')
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

const getBattle = async (req, res, next) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate('creator', 'name mobile balance')
      .populate('joiner', 'name mobile balance')
      .populate('winner', 'name mobile');

    if (!battle) {
      return res.status(404).json({ success: false, message: 'Battle not found' });
    }

    res.json({ success: true, battle: formatBattle(battle) });
  } catch (error) {
    next(error);
  }
};

const cancelBattleHandler = async (req, res) => {
  try {
    const { reason } = req.body;
    const battle = await cancelBattle(req.params.id, reason || 'Cancelled by admin');

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile');

    res.json({
      success: true,
      message: 'Battle cancelled and entry fees refunded',
      battle: formatBattle(populated),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBattleHandler = async (req, res) => {
  try {
    const result = await deleteBattle(req.params.id);
    res.json({ success: true, message: 'Battle deleted', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forceCompleteBattle = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) {
      return res.status(400).json({ success: false, message: 'winnerId is required' });
    }

    const battle = await completeBattle({ battleId: req.params.id, winnerId });

    const populated = await Battle.findById(battle._id)
      .populate('creator', 'name mobile')
      .populate('joiner', 'name mobile')
      .populate('winner', 'name mobile');

    res.json({
      success: true,
      message: 'Battle completed and winner credited',
      battle: formatBattle(populated),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  listBattles,
  getBattle,
  cancelBattleHandler,
  deleteBattleHandler,
  forceCompleteBattle,
};
