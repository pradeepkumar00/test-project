const config = require('config');
const { getRedis } = require('../config/redis');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const otpKey = (mobile, purpose) => `otp:${purpose}:${mobile}`;

const sendOtp = async (mobile, purpose = 'login') => {
  const redis = getRedis();
  const otp = generateOtp();
  const expiryMinutes = config.get('otp.expiryMinutes');
  const ttlSeconds = expiryMinutes * 60;

  await redis.set(otpKey(mobile, purpose), otp, 'EX', ttlSeconds);

  console.log(`[OTP] ${mobile} -> ${otp} (${purpose}, expires in ${expiryMinutes}m)`);

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
