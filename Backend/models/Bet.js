const mongoose = require('mongoose');

const betSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    round: { type: mongoose.Schema.Types.ObjectId, ref: 'GameRound', required: true, index: true },
    period: { type: String, required: true },
    betType: {
      type: String,
      enum: ['color', 'number', 'big_small'],
      required: true,
    },
    selection: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    multiplier: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'cancelled', 'refunded'],
      default: 'pending',
    },
    payout: { type: Number, default: 0 },
    settledAt: Date,
  },
  { timestamps: true }
);

betSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Bet', betSchema);
