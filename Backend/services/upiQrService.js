const QRCode = require('qrcode');
const config = require('config');
const { getPlatformSettings } = require('./platformSettingsService');

const buildUpiUri = ({ upiId, payeeName, amount, note, currency = 'INR' }) => {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  params.set('pn', payeeName);
  params.set('am', Number(amount).toFixed(2));
  params.set('cu', currency);
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

const createDepositQr = async ({ amount, orderId }) => {
  const settings = await getPlatformSettings();
  const upiId = settings.upiId;
  const payeeName = settings.upiPayeeName || config.get('appName') || 'BigFun';
  const note = `BigFun ${orderId}`;
  const upiUri = buildUpiUri({
    upiId,
    payeeName,
    amount,
    note,
    currency: settings.currency,
  });
  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    width: 280,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return { upiId, payeeName, upiUri, qrDataUrl, amount };
};

module.exports = { createDepositQr, buildUpiUri };
