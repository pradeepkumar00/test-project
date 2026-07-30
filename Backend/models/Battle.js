const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    result: { type: String, enum: ['won', 'lost', 'cancel'], default: undefined },
    screenshotUrl: { type: String, default: null },
    reportedAt: Date,
  },
  { _id: false }
);

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
      enum: ['open', 'matched', 'running', 'pending_verification', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    /** Ludo King room code shared by creator after Start */
    roomCode: { type: String, default: null, trim: true },
    roomCodeSetAt: Date,
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    /** Claimed winner awaiting admin verification */
    claimedWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resultScreenshotUrl: { type: String, default: null },
    creatorClaim: { type: claimSchema, default: () => ({}) },
    joinerClaim: { type: claimSchema, default: () => ({}) },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    verifiedAt: Date,
    rejectReason: String,
    /** True when player claims contradict each other (both won, win vs cancel, etc.) */
    resultConflict: { type: Boolean, default: false },
    conflictType: {
      type: String,
      enum: ['single_win', 'agreed_win_loss', 'both_won', 'win_vs_cancel'],
      default: undefined,
    },
    conflictNote: { type: String, default: null },
    creatorDeduction: {
      fromBonus: { type: Number, default: 0 },
      fromMain: { type: Number, default: 0 },
    },
    joinerDeduction: {
      fromBonus: { type: Number, default: 0 },
      fromMain: { type: Number, default: 0 },
    },
    matchedAt: Date,
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
