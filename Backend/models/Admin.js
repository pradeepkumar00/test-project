const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/** Staff accounts (admin / superadmin). Players live in the User collection. */
const adminSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['admin', 'superadmin'], required: true, index: true },
    /** Fine-grained access for role=admin. Superadmin ignores this and has all access. */
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

adminSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
