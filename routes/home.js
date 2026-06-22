const express = require('express');
const auth = require('../middleware/auth');
const homeController = require('../controllers/home');

const router = express.Router();

router.get('/', auth, homeController.getHome);

module.exports = router;
