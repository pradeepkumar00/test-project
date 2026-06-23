const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    period: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['betting', 'locked', 'completed'],
      default: 'betting',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    resultNumber: { type: Number, min: 0, max: 9, default: null },
    resultColor: { type: String, enum: ['red', 'green', 'violet', null], default: null },
    resultSize: { type: String, enum: ['big', 'small', null], default: null },
    totalBets: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gameRoundSchema.index({ game: 1, status: 1 });
gameRoundSchema.index({ game: 1, createdAt: -1 });

module.exports = mongoose.model('GameRound', gameRoundSchema);
