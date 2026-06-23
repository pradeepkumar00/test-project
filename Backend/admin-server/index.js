const config = require('config');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../config/db');
const routes = require('./routes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
const port = config.get('adminServer.port');
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(morgan(isDev ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

const start = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`BigFun Admin API running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log(`Admin login: POST http://localhost:${port}/api/auth/login`);
  });
};

start().catch((err) => {
  console.error('Failed to start admin server:', err.message);
  process.exit(1);
});
