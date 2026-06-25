#!/usr/bin/env node

const connectDB = require('../config/db');
const User = require('../models/User');
const { generateReferralCode } = require('../utils/helpers');

const MOBILE_REGEX = /^[6-9]\d{9}$/;

const usage = () => {
  console.log(`
Onboard a superadmin account for the BigFun admin portal.

Usage:
  node scripts/onboard-superadmin.js --mobile <10-digit> --password <password> [--name "Name"]
  npm run onboard:superadmin -- --mobile <10-digit> --password <password> [--name "Name"]

Options:
  --mobile, -m     10-digit Indian mobile (required)
  --password, -p   Login password, min 6 characters (required)
  --name, -n       Display name (default: "Super Admin")
  --promote        Upgrade an existing user to superadmin (updates password if provided)
  --help, -h       Show this help

Environment (optional instead of flags):
  SUPERADMIN_MOBILE
  SUPERADMIN_PASSWORD
  SUPERADMIN_NAME

Examples:
  npm run onboard:superadmin -- --mobile 9999999999 --password admin123
  npm run onboard:superadmin -- -m 9876543210 -p secret123 -n "Ops Lead" --promote
  SUPERADMIN_MOBILE=9782578795 SUPERADMIN_PASSWORD='Admin@123' SUPERADMIN_NAME="New Admin" npm run onboard:superadmin -w bigfun-backend
`);
};

const parseArgs = (argv) => {
  const options = {
    mobile: process.env.SUPERADMIN_MOBILE || '',
    password: process.env.SUPERADMIN_PASSWORD || '',
    name: process.env.SUPERADMIN_NAME || 'Super Admin',
    promote: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--promote') {
      options.promote = true;
      continue;
    }

    if (arg === '--mobile' || arg === '-m') {
      options.mobile = argv[i + 1] || '';
      i += 1;
      continue;
    }

    if (arg === '--password' || arg === '-p') {
      options.password = argv[i + 1] || '';
      i += 1;
      continue;
    }

    if (arg === '--name' || arg === '-n') {
      options.name = argv[i + 1] || options.name;
      i += 1;
    }
  }

  return options;
};

const validateInput = ({ mobile, password }) => {
  if (!mobile || !password) {
    throw new Error('Both --mobile and --password are required');
  }

  if (!MOBILE_REGEX.test(mobile)) {
    throw new Error('Mobile must be a valid 10-digit Indian number (starts with 6-9)');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
};

const createUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generateReferralCode();
    exists = await User.exists({ referralCode: code });
  }

  return code;
};

const onboardSuperAdmin = async ({ mobile, password, name, promote }) => {
  await connectDB();

  let user = await User.findOne({ mobile }).select('+password');

  if (user) {
    if (!promote && user.role === 'superadmin') {
      console.log(`Superadmin already exists: ${mobile}`);
      console.log('Use --promote to reset password and ensure superadmin role.');
      return user;
    }

    user.role = 'superadmin';
    user.isActive = true;
    user.isVerified = true;
    if (name) user.name = name;
    user.password = password;
    await user.save();

    console.log(`Updated existing account to superadmin: ${mobile}`);
    return user;
  }

  if (promote) {
    throw new Error(`No user found with mobile ${mobile}. Remove --promote to create a new superadmin.`);
  }

  const referralCode = await createUniqueReferralCode();

  user = await User.create({
    mobile,
    password,
    name,
    referralCode,
    role: 'superadmin',
    isVerified: true,
    isActive: true,
  });

  console.log(`Created superadmin: ${mobile}`);
  return user;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    usage();
    process.exit(0);
  }

  validateInput(options);

  const user = await onboardSuperAdmin(options);

  console.log('');
  console.log('Superadmin onboarded successfully');
  console.log(`  Mobile:  ${user.mobile}`);
  console.log(`  Name:    ${user.name}`);
  console.log(`  Role:    ${user.role}`);
  console.log(`  Active:  ${user.isActive}`);
  console.log('');
  console.log('Admin login: POST /api/admin/auth/login');
  console.log(`  { "mobile": "${user.mobile}", "password": "<password you set>" }`);

  process.exit(0);
};

main().catch((error) => {
  console.error('Onboard superadmin failed:', error.message);
  process.exit(1);
});
