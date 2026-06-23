const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, default: 'UPI' },
    utrNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },
    orderId: { type: String, unique: true, required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: Date,
    rejectReason: String,
    completedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deposit', depositSchema);
