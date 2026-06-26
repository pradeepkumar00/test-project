const config = require('config');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { runGameScheduler } = require('./services/gameEngine');
const { warmPlatformSettingsCache } = require('./services/platformSettingsService');

const app = express();
const port = config.get('port');

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/api', routes);

app.get('/login', (req, res) => {
  const refer = req.query.refer || '';
  res.json({
    success: true,
    message: 'Use POST /api/auth/register with referralCode to sign up',
    referralCode: refer,
    registerEndpoint: '/api/auth/register',
    validateReferralEndpoint: `/api/auth/referral/${refer}`,
  });
});

app.use(errorHandler);

const start = async () => {
  await connectDB();
  await connectRedis();
  await warmPlatformSettingsCache();

  cron.schedule('* * * * * *', () => {
    runGameScheduler().catch((err) => logger.error('Game scheduler error', { message: err.message }));
  });

  app.listen(port, () => {
    logger.info('BigFun API started', {
      port,
      healthCheck: `http://localhost:${port}/api/health`,
      adminApi: `http://localhost:${port}/api/admin`,
    });
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});
