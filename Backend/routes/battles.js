const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const battlesController = require('../controllers/battles');
const { uploadBattleScreenshot } = require('../middleware/upload');

const router = express.Router();

router.get('/prize-preview', battlesController.previewPrize);

router.use(auth);

router.post('/', battlesController.createBattleValidation, validate, battlesController.createBattleHandler);
router.get('/open', battlesController.getOpenBattles);
router.get('/running', battlesController.getRunningBattles);
router.get('/matched', battlesController.getMatchedBattles);
router.get('/challenges', battlesController.getChallenges);
router.get('/leaderboard', battlesController.getLeaderboard);
router.get('/my', battlesController.getMyBattles);
router.get('/active', battlesController.getActiveBattle);
router.get('/:id', battlesController.getBattleById);
router.post('/:id/join', battlesController.joinBattleHandler);
router.post(
  '/:id/start',
  [body('roomCode').isString().trim().isLength({ min: 4, max: 20 })],
  validate,
  battlesController.startBattleHandler
);
router.post('/:id/report', (req, res, next) => {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  uploadBattleScreenshot(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    return next();
  });
}, battlesController.reportResultHandler);
router.post('/:id/cancel', battlesController.cancelMyBattleHandler);
router.post('/:id/complete', battlesController.completeBattleHandler);

module.exports = router;
