const {
  DEPOSIT_REJECTION_REASONS,
  WITHDRAWAL_REJECTION_REASONS,
} = require('../../constants/rejectionReasons');

const getRejectionReasons = (req, res) => {
  res.json({
    success: true,
    depositReasons: DEPOSIT_REJECTION_REASONS,
    withdrawalReasons: WITHDRAWAL_REJECTION_REASONS,
  });
};

module.exports = { getRejectionReasons };
