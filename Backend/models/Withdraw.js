const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    upiId: String,
    accountNumber: String,
    ifsc: String,
    accountHolder: String,
    rejectReason: String,
    processedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdraw', withdrawSchema);
