const config = require('config');
const { getRedis } = require('../config/redis');
const { sendOtpSms } = require('./smsService');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const otpKey = (mobile, purpose) => `otp:${purpose}:${mobile}`;

const sendOtp = async (mobile, purpose = 'login') => {
  const redis = getRedis();
  const otp = generateOtp();
  const expiryMinutes = config.get('otp.expiryMinutes');
  const ttlSeconds = expiryMinutes * 60;
  const key = otpKey(mobile, purpose);

  await redis.set(key, otp, 'EX', ttlSeconds);

  try {
    await sendOtpSms(mobile, otp, purpose);
  } catch (error) {
    await redis.del(key);
    throw error;
  }

  return { success: true, message: 'OTP sent successfully', expiresIn: ttlSeconds };
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

module.exports = { sendOtp, verifyOtp, generateOtp };
