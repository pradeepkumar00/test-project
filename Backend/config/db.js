const config = require('config');
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(config.get('mongodb.uri'));
  console.log('MongoDB connected');
};

module.exports = connectDB;
