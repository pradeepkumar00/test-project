const config = require('config');

const getFirebaseClientConfig = () => {
  if (!config.has('firebase.enabled') || config.get('firebase.enabled') !== true) {
    return null;
  }

  return {
    apiKey: config.has('firebase.apiKey') ? config.get('firebase.apiKey') : '',
    authDomain: config.has('firebase.authDomain') ? config.get('firebase.authDomain') : '',
    databaseURL: config.has('firebase.databaseURL') ? config.get('firebase.databaseURL') : '',
    projectId: config.has('firebase.projectId') ? config.get('firebase.projectId') : '',
  };
};

const getRealtimeSyncConfig = () => {
  const firebaseEnabled = config.has('firebase.enabled') && config.get('firebase.enabled') === true;
  const walletIntervalMs = config.has('polling.walletIntervalMs')
    ? Number(config.get('polling.walletIntervalMs'))
    : 5000;
  const battlesIntervalMs = config.has('polling.battlesIntervalMs')
    ? Number(config.get('polling.battlesIntervalMs'))
    : 15000;

  return {
    firebaseEnabled,
    walletPollingEnabled: !firebaseEnabled && walletIntervalMs > 0,
    battlesPollingEnabled: !firebaseEnabled && battlesIntervalMs > 0,
    walletPollIntervalMs: firebaseEnabled ? 0 : walletIntervalMs,
    battlesPollIntervalMs: firebaseEnabled ? 0 : battlesIntervalMs,
    firebase: getFirebaseClientConfig(),
  };
};

module.exports = { getRealtimeSyncConfig, getFirebaseClientConfig };
