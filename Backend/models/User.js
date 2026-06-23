const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: '' },
    referralCode: { type: String, unique: true, required: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    balance: { type: Number, default: 0, min: 0 },
    bonusBalance: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
      bankName: String,
    },
    kyc: {
      panNumber: String,
      aadhaarNumber: String,
      isVerified: { type: Boolean, default: false },
    },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    income: { type: Number, default: 0, min: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.getTotalBalance = function getTotalBalance() {
  return this.balance + this.bonusBalance;
};

module.exports = mongoose.model('User', userSchema);
