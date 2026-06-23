const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['color', 'number', 'big_small'], default: 'color' },
    durationSeconds: { type: Number, required: true },
    minBet: { type: Number, default: 10 },
    maxBet: { type: Number, default: 100000 },
    isActive: { type: Boolean, default: true },
    description: String,
    multipliers: {
      red: { type: Number, default: 2 },
      green: { type: Number, default: 2 },
      violet: { type: Number, default: 4.5 },
      exact: { type: Number, default: 9 },
      big: { type: Number, default: 2 },
      small: { type: Number, default: 2 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Game', gameSchema);
