const config = require('config');
const { getRedis } = require('../config/redis');
const { sendOtpSms } = require('./smsService');
const { sendOtpWhatsApp } = require('./whatsappService');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const otpKey = (mobile, purpose) => `otp:${purpose}:${mobile}`;

const getOtpChannel = () => {
  if (config.has('otp.channel')) {
    return String(config.get('otp.channel')).toLowerCase();
  }
  return 'whatsapp';
};

const deliverOtp = async (mobile, otp, purpose) => {
  const channel = getOtpChannel();
  if (channel === 'sms') {
    return sendOtpSms(mobile, otp, purpose);
  }
  return sendOtpWhatsApp(mobile, otp, purpose);
};

const sendOtp = async (mobile, purpose = 'login') => {
  const redis = getRedis();
  const otp = generateOtp();
  const expiryMinutes = config.get('otp.expiryMinutes');
  const ttlSeconds = expiryMinutes * 60;
  const key = otpKey(mobile, purpose);
  const channel = getOtpChannel();

  await redis.set(key, otp, 'EX', ttlSeconds);

  try {
    console.log(`Sending OTP via ${channel} to`, mobile, purpose);
    console.log('OTP: for mobile', mobile, 'is', otp);
    await deliverOtp(mobile, otp, purpose);
  } catch (error) {
    await redis.del(key);
    throw error;
  }

  const channelLabel = channel === 'sms' ? 'SMS' : 'WhatsApp';
  return {
    success: true,
    message: `OTP sent successfully on ${channelLabel}`,
    channel,
    expiresIn: ttlSeconds,
  };
};

const verifyOtp = async (mobile, otp, purpose = 'login', { allowPurposes } = {}) => {
  const submitted = String(otp || '').trim();

  if (isOtpBypassEnabled()) {
    const bypassCode = getBypassOtpCode();
    if (bypassCode && submitted === bypassCode) {
      console.log(`[OTP bypass] Accepted bypass OTP for ${mobile} (${purpose})`);
      // Clear any pending real OTPs so they don't linger
      const redis = getRedis();
      const purposes = allowPurposes || [purpose];
      await Promise.all(purposes.map((p) => redis.del(otpKey(mobile, p))));
      return { valid: true, bypassed: true };
    }
  }

  const redis = getRedis();
  const purposes = allowPurposes || [purpose];

  for (const p of purposes) {
    const key = otpKey(mobile, p);
    const stored = await redis.get(key);

    if (stored === submitted) {
      await redis.del(key);
      return { valid: true };
    }
  }

  return { valid: false, message: 'Invalid or expired OTP' };
};

const isTruthy = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

const isOtpBypassEnabled = () => {
  if (!config.has('otp.bypass.enabled')) return false;
  return isTruthy(config.get('otp.bypass.enabled'));
};

const getBypassOtpCode = () => {
  if (!config.has('otp.bypass.code')) return '';
  return String(config.get('otp.bypass.code') || '').trim();
};

module.exports = {
  sendOtp,
  verifyOtp,
  generateOtp,
  getOtpChannel,
  isOtpBypassEnabled,
  getBypassOtpCode,
};
