const fs = require('fs');
const path = require('path');
const config = require('config');
const admin = require('firebase-admin');

let initialized = false;

const isEnabled = () => {
  try {
    return config.get('firebase.enabled') === true;
  } catch {
    return false;
  }
};

const resolveServiceAccount = () => {
  const inline = config.has('firebase.serviceAccount') ? config.get('firebase.serviceAccount') : null;
  if (inline && typeof inline === 'object' && inline.project_id) {
    return inline;
  }

  const accountPath = config.has('firebase.serviceAccountPath')
    ? config.get('firebase.serviceAccountPath')
    : null;

  if (!accountPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(accountPath)
    ? accountPath
    : path.join(__dirname, '..', accountPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file not found at ${resolvedPath}`);
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
};

const initFirebase = () => {
  if (initialized || !isEnabled()) {
    return;
  }

  const serviceAccount = resolveServiceAccount();
  const databaseURL = config.get('firebase.databaseURL');

  if (!serviceAccount || !databaseURL) {
    throw new Error(
      'Firebase is enabled but missing serviceAccount/serviceAccountPath or databaseURL in config'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
  });

  initialized = true;
};

const getDatabase = () => {
  initFirebase();
  return admin.database();
};

const buildWalletPayload = (user, reason, extra = {}) => ({
  balance: user.balance,
  bonusBalance: user.bonusBalance,
  totalBalance: user.balance + user.bonusBalance,
  income: user.income || 0,
  reason,
  updatedAt: Date.now(),
  ...extra,
});

const publishWalletUpdate = async (user, reason, extra = {}) => {
  if (!user?._id) {
    return null;
  }

  if (!isEnabled()) {
    return null;
  }

  try {
    initFirebase();
    const userId = user._id.toString();
    const payload = buildWalletPayload(user, reason, extra);
    await getDatabase().ref(`wallets/${userId}`).set(payload);
    return payload;
  } catch (error) {
    console.error('[Firebase] Failed to publish wallet update:', error.message);
    return null;
  }
};

const createCustomToken = async (userId) => {
  if (!isEnabled()) {
    return null;
  }

  initFirebase();
  return admin.auth().createCustomToken(String(userId));
};

module.exports = {
  isEnabled,
  publishWalletUpdate,
  createCustomToken,
};
