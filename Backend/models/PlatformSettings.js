const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'platform' },
    upiId: { type: String, required: true, trim: true },
    upiPayeeName: { type: String, required: true, trim: true },
    paymentLabel: { type: String, required: true, trim: true },
    minEntryFee: { type: Number, required: true, min: 1 },
    maxEntryFee: { type: Number, required: true, min: 1 },
    minDeposit: { type: Number, required: true, min: 1 },
    minWithdraw: { type: Number, required: true, min: 1 },
    referralBonus: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    currencySymbol: { type: String, required: true, trim: true },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    paymentMethods: { type: [String], required: true, default: [] },
    withdrawMethods: { type: [String], required: true, default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, _id: false }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
