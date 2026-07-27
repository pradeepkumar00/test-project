#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const SECRETS_DIR = path.join(__dirname, '..', 'secrets');
const SECRETS_FILE = path.join(SECRETS_DIR, 'superadmin.json');

const usage = () => {
  console.log(`
Onboard a superadmin account for the Masti Ludo superadmin portal.

Usage:
  node scripts/onboard-superadmin.js --mobile <10-digit> --password <password> [options]
  npm run onboard:superadmin -- --mobile <10-digit> --password <password> [options]

Options:
  --mobile, -m       10-digit Indian mobile (required unless in env / secrets)
  --password, -p     Login password, min 6 characters (or use --generate)
  --generate, -g     Generate a strong password
  --name, -n         Display name (default: "Super Admin")
  --promote          Reset password / ensure role on an existing admin account
  --save-secrets     Write credentials to Backend/secrets/superadmin.json (default: on)
  --no-save-secrets  Do not write the secrets file
  --help, -h         Show this help

Environment (optional instead of flags):
  SUPERADMIN_MOBILE
  SUPERADMIN_PASSWORD
  SUPERADMIN_NAME

Examples:
  npm run onboard:superadmin -- --mobile 9999999999 --generate --promote
  npm run onboard:superadmin -- -m 9876543210 -p 'Secret@123' -n "Ops Lead" --promote
`);
};

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (set) => set[crypto.randomInt(0, set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 12; i += 1) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

const parseArgs = (argv) => {
  const options = {
    mobile: process.env.SUPERADMIN_MOBILE || '',
    password: process.env.SUPERADMIN_PASSWORD || '',
    name: process.env.SUPERADMIN_NAME || 'Super Admin',
    promote: false,
    generate: false,
    saveSecrets: true,
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
    if (arg === '--generate' || arg === '-g') {
      options.generate = true;
      continue;
    }
    if (arg === '--save-secrets') {
      options.saveSecrets = true;
      continue;
    }
    if (arg === '--no-save-secrets') {
      options.saveSecrets = false;
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
    throw new Error('Both --mobile and --password are required (or use --generate)');
  }
  if (!MOBILE_REGEX.test(mobile)) {
    throw new Error('Mobile must be a valid 10-digit Indian number (starts with 6-9)');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
};

const saveSecretsFile = ({ mobile, password, name, role }) => {
  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
  }

  const payload = {
    portal: 'Masti Ludo Superadmin',
    role,
    name,
    mobile,
    password,
    loginUrlHint: 'Superadmin panel → /login',
    apiLogin: 'POST /api/superadmin/auth/login',
    createdAt: new Date().toISOString(),
    warning: 'DO NOT COMMIT THIS FILE. Keep it private.',
  };

  fs.writeFileSync(SECRETS_FILE, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return SECRETS_FILE;
};

const onboardSuperAdmin = async ({ mobile, password, name, promote }) => {
  await connectDB();

  let admin = await Admin.findOne({ mobile }).select('+password');

  if (admin) {
    if (!promote && admin.role === 'superadmin') {
      console.log(`Superadmin already exists: ${mobile}`);
      console.log('Use --promote to reset password and ensure superadmin role.');
      return { admin, created: false, updated: false };
    }

    admin.role = 'superadmin';
    admin.isActive = true;
    admin.permissions = [];
    if (name) admin.name = name;
    admin.password = password;
    await admin.save();

    console.log(`Updated existing admin to superadmin: ${mobile}`);
    return { admin, created: false, updated: true };
  }

  if (promote) {
    throw new Error(`No admin found with mobile ${mobile}. Remove --promote to create a new superadmin.`);
  }

  admin = await Admin.create({
    mobile,
    password,
    name,
    role: 'superadmin',
    permissions: [],
    isActive: true,
  });

  console.log(`Created superadmin: ${mobile}`);
  return { admin, created: true, updated: false };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    usage();
    process.exit(0);
  }

  if (options.generate) {
    options.password = generatePassword();
    console.log('Generated a strong password.');
  } else if (!options.password) {
    options.password = generatePassword();
    console.log('No password provided — generated a strong password.');
  }

  if (!options.mobile) {
    options.mobile = '9999999999';
    console.log(`Using default portal mobile: ${options.mobile}`);
  }

  validateInput(options);

  const { admin, created, updated } = await onboardSuperAdmin(options);

  let secretsPath = null;
  if (options.saveSecrets && (created || updated)) {
    secretsPath = saveSecretsFile({
      mobile: admin.mobile,
      password: options.password,
      name: admin.name,
      role: admin.role,
    });
  } else if (options.saveSecrets && !created && !updated) {
    console.log('Secrets file not updated (account already existed; use --promote or --generate to reset).');
  }

  console.log('');
  console.log('Superadmin ready');
  console.log(`  Mobile:  ${admin.mobile}`);
  console.log(`  Name:    ${admin.name}`);
  console.log(`  Role:    ${admin.role}`);
  console.log(`  Active:  ${admin.isActive}`);
  if (secretsPath) {
    console.log(`  Secrets: ${secretsPath}`);
  }
  console.log('');
  console.log('Superadmin login: POST /api/superadmin/auth/login');
  console.log(`  { "mobile": "${admin.mobile}", "password": "(see secrets file)" }`);

  process.exit(0);
};

main().catch((error) => {
  console.error('Onboard superadmin failed:', error.message);
  process.exit(1);
});
