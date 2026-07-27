#!/usr/bin/env node

/**
 * One-time migration: move staff accounts from `users` → `admins`.
 * Preserves _id so Deposit.reviewedBy / PlatformSettings.updatedBy stay valid.
 *
 * Usage: node scripts/migrate-admins-collection.js
 */
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');

const migrate = async () => {
  await connectDB();

  // Use native collection — `role` is no longer on the User schema
  const staff = await User.collection
    .find({ role: { $in: ['admin', 'superadmin'] } })
    .toArray();

  if (!staff.length) {
    console.log('No staff accounts found on users collection. Nothing to migrate.');
    const existingAdmins = await Admin.countDocuments();
    console.log(`Admins collection already has ${existingAdmins} document(s).`);
    await mongoose.connection.close();
    process.exit(0);
  }

  let migrated = 0;
  let skipped = 0;

  for (const user of staff) {
    const exists = await Admin.findById(user._id);
    if (exists) {
      console.log(`Skip (already in admins): ${user.mobile} (${user.role})`);
      skipped += 1;
    } else {
      const now = new Date();
      await Admin.collection.insertOne({
        _id: user._id,
        mobile: user.mobile,
        password: user.password,
        name: user.name || '',
        role: user.role,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        isActive: user.isActive !== false,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt || now,
        updatedAt: user.updatedAt || now,
      });
      console.log(`Migrated: ${user.mobile} → admins (${user.role})`);
      migrated += 1;
    }

    await User.collection.deleteOne({ _id: user._id });
    console.log(`Removed from users: ${user.mobile}`);
  }

  const unsetResult = await User.collection.updateMany(
    {},
    { $unset: { role: '', permissions: '' } }
  );

  console.log('');
  console.log(`Done. Migrated: ${migrated}, skipped existing: ${skipped}`);
  console.log(`Unset role/permissions on ${unsetResult.modifiedCount} user document(s).`);
  await mongoose.connection.close();
  process.exit(0);
};

migrate().catch(async (error) => {
  console.error('Migration failed:', error);
  try {
    await mongoose.connection.close();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
