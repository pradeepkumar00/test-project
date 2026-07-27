const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joiner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    /** When set, only this user can join (private challenge). Null = public open battle. */
    challengedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    gameType: { type: String, required: true, default: 'ludo-classic' },
    entryFee: { type: Number, required: true, min: 1 },
    totalPool: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    winningPrize: { type: Number, required: true },
    status: {
      type: String,
      enum: ['open', 'running', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    creatorDeduction: {
      fromBonus: { type: Number, default: 0 },
      fromMain: { type: Number, default: 0 },
    },
    joinerDeduction: {
      fromBonus: { type: Number, default: 0 },
      fromMain: { type: Number, default: 0 },
    },
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ status: 1, challengedUser: 1, createdAt: -1 });

module.exports = mongoose.model('Battle', battleSchema);
