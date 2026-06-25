const config = require('config');
const jwt = require('jsonwebtoken');
const { createJwtId } = require('../services/tokenBlacklistService');

const generateToken = (userId) =>
  jwt.sign({ userId }, config.get('jwt.secret'), {
    expiresIn: config.get('jwt.expiresIn'),
    jwtid: createJwtId(),
  });

const generateReferralCode = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
};

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BF${ts}${rand}`;
};

const generatePeriod = (gameSlug, startTime) => {
  const date = new Date(startTime);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${gameSlug.replace(/-/g, '')}${y}${m}${d}${h}${min}${sec}${ms}`;
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  mobile: user.mobile,
  name: user.name,
  referralCode: user.referralCode,
  balance: user.balance,
  bonusBalance: user.bonusBalance,
  totalBalance: user.balance + user.bonusBalance,
  isVerified: user.isVerified,
  bankDetails: user.bankDetails,
  kycVerified: user.kyc?.isVerified || false,
  referralCount: user.referralCount,
  referralEarnings: user.referralEarnings,
  income: user.income || 0,
  gamesPlayed: user.gamesPlayed || 0,
  gamesWon: user.gamesWon || 0,
  totalDeposited: user.totalDeposited,
  totalWithdrawn: user.totalWithdrawn,
  createdAt: user.createdAt,
});

const getNumberColor = (num) => {
  if (num === 0 || num === 5) return 'violet';
  if ([1, 3, 7, 9].includes(num)) return 'green';
  return 'red';
};

const getNumberSize = (num) => (num >= 5 ? 'big' : 'small');

const getColorNumbers = (color) => {
  if (color === 'violet') return [0, 5];
  if (color === 'green') return [1, 3, 7, 9];
  if (color === 'red') return [2, 4, 6, 8];
  return [];
};

module.exports = {
  generateToken,
  generateReferralCode,
  generateOrderId,
  generatePeriod,
  sanitizeUser,
  getNumberColor,
  getNumberSize,
  getColorNumbers,
};
