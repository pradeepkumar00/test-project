const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const battlesController = require('../controllers/battles');

const router = express.Router();

router.get('/prize-preview', battlesController.previewPrize);

router.use(auth);

router.post('/', battlesController.createBattleValidation, validate, battlesController.createBattleHandler);
router.get('/open', battlesController.getOpenBattles);
router.get('/running', battlesController.getRunningBattles);
router.get('/my', battlesController.getMyBattles);
router.post('/:id/join', battlesController.joinBattleHandler);
router.post('/:id/complete', battlesController.completeBattleHandler);

module.exports = router;
