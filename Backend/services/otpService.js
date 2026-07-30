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
  const redis = getRedis();
  const purposes = allowPurposes || [purpose];

  for (const p of purposes) {
    const key = otpKey(mobile, p);
    const stored = await redis.get(key);

    if (stored === otp) {
      await redis.del(key);
      return { valid: true };
    }
  }

  return { valid: false, message: 'Invalid or expired OTP' };
};

module.exports = { sendOtp, verifyOtp, generateOtp, getOtpChannel };
