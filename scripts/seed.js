const connectDB = require('../config/db');
const Game = require('../models/Game');
const User = require('../models/User');
const { generateReferralCode } = require('../utils/helpers');
const { createRound } = require('../services/gameEngine');

const games = [
  {
    slug: 'wingo-1min',
    name: 'Win Go 1 Min',
    type: 'color',
    durationSeconds: 60,
    minBet: 10,
    maxBet: 100000,
    description: 'Color prediction game - 1 minute rounds',
  },
  {
    slug: 'wingo-3min',
    name: 'Win Go 3 Min',
    type: 'color',
    durationSeconds: 180,
    minBet: 10,
    maxBet: 100000,
    description: 'Color prediction game - 3 minute rounds',
  },
  {
    slug: 'wingo-5min',
    name: 'Win Go 5 Min',
    type: 'color',
    durationSeconds: 300,
    minBet: 10,
    maxBet: 100000,
    description: 'Color prediction game - 5 minute rounds',
  },
];

const seed = async () => {
  await connectDB();

  for (const gameData of games) {
    const existing = await Game.findOne({ slug: gameData.slug });
    if (!existing) {
      const game = await Game.create(gameData);
      await createRound(game);
      console.log(`Created game: ${game.name}`);
    } else {
      console.log(`Game already exists: ${existing.name}`);
    }
  }

  const demoMobile = '9876543210';
  let demoUser = await User.findOne({ mobile: demoMobile });
  if (!demoUser) {
    demoUser = await User.create({
      mobile: demoMobile,
      password: 'demo123',
      name: 'Demo User',
      referralCode: '816319',
      balance: 1000,
      isVerified: true,
    });
    console.log(`Created demo user: ${demoMobile} / demo123 (referral: 816319)`);
  } else {
    console.log('Demo user already exists');
  }

  const adminMobile = '9999999999';
  let adminUser = await User.findOne({ mobile: adminMobile });
  if (!adminUser) {
    adminUser = await User.create({
      mobile: adminMobile,
      password: 'admin123',
      name: 'Super Admin',
      referralCode: '100001',
      role: 'superadmin',
      isVerified: true,
    });
    console.log(`Created superadmin: ${adminMobile} / admin123`);
  } else if (adminUser.role !== 'superadmin') {
    adminUser.role = 'superadmin';
    await adminUser.save();
    console.log('Updated existing admin to superadmin role');
  } else {
    console.log('Superadmin already exists');
  }

  const player2Mobile = '9123456781';
  let player2 = await User.findOne({ mobile: player2Mobile });
  if (!player2) {
    player2 = await User.create({
      mobile: player2Mobile,
      password: 'demo123',
      name: 'Player Two',
      referralCode: '912345',
      balance: 5000,
      isVerified: true,
    });
    console.log(`Created player2: ${player2Mobile} / demo123 (balance: 5000)`);
  }

  console.log('Seed completed');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
