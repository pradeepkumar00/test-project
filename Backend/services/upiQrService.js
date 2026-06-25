const QRCode = require('qrcode');
const config = require('config');

const buildUpiUri = ({ upiId, payeeName, amount, note }) => {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  params.set('pn', payeeName);
  params.set('am', Number(amount).toFixed(2));
  params.set('cu', 'INR');
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

const createDepositQr = async ({ amount, orderId }) => {
  const upiId = config.get('wallet.upiId');
  const payeeName = config.get('wallet.upiPayeeName') || config.get('appName') || 'BigFun';
  const note = `BigFun ${orderId}`;
  const upiUri = buildUpiUri({ upiId, payeeName, amount, note });
  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    width: 280,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return { upiId, payeeName, upiUri, qrDataUrl, amount };
};

module.exports = { createDepositQr, buildUpiUri };
