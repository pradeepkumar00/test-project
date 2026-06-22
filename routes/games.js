const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const gamesController = require('../controllers/games');

const router = express.Router();

router.get('/', gamesController.listGames);
router.get('/bets/my', auth, gamesController.getMyBets);
router.get('/bets/:betId', auth, gamesController.getBetById);
router.get('/:slug/current-round', gamesController.getCurrentRound);
router.get('/:slug/history', gamesController.getRoundHistory);
router.post('/:slug/bet', auth, gamesController.betValidation, validate, gamesController.placeBetHandler);
router.get('/:slug', gamesController.getGame);

module.exports = router;
