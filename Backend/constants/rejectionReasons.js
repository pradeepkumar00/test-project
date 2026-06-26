const DEPOSIT_REJECTION_REASONS = [
  'Payment not received in bank account',
  'Invalid or duplicate UTR number',
  'Deposit amount does not match payment',
  'Wrong UPI ID used for payment',
  'Payment proof is unclear or incomplete',
  'Other',
];

const WITHDRAWAL_REJECTION_REASONS = [
  'Incorrect UPI or bank account details',
  'Account holder name mismatch',
  'KYC verification required',
  'Suspected fraudulent activity',
  'Withdrawal details could not be verified',
  'Other',
];

const OTHER_REASON_LABEL = 'Other';

module.exports = {
  DEPOSIT_REJECTION_REASONS,
  WITHDRAWAL_REJECTION_REASONS,
  OTHER_REASON_LABEL,
};
