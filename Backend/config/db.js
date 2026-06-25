const config = require('config');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  await mongoose.connect(config.get('mongodb.uri'));
  logger.info('MongoDB connected');
};

module.exports = connectDB;
