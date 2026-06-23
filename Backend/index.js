const config = require('config');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { runGameScheduler } = require('./services/gameEngine');

const app = express();
const port = config.get('port');
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(morgan(isDev ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  cron.schedule('* * * * * *', () => {
    runGameScheduler().catch((err) => console.error('Game scheduler error:', err.message));
  });

  app.listen(port, () => {
    console.log(`BigFun API running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
