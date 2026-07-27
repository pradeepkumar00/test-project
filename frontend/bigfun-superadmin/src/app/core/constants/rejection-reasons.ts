export const OTHER_REJECTION_REASON = 'Other';

export const DEFAULT_DEPOSIT_REJECTION_REASONS = [
  'Payment not received in bank account',
  'Invalid or duplicate UTR number',
  'Deposit amount does not match payment',
  'Wrong UPI ID used for payment',
  'Payment proof is unclear or incomplete',
  OTHER_REJECTION_REASON,
];

export const DEFAULT_WITHDRAWAL_REJECTION_REASONS = [
  'Incorrect UPI or bank account details',
  'Account holder name mismatch',
  'KYC verification required',
  'Suspected fraudulent activity',
  'Withdrawal details could not be verified',
  OTHER_REJECTION_REASON,
];

export const resolveRejectionReason = (
  selectedReason: string,
  customReason: string,
  otherLabel = OTHER_REJECTION_REASON
): string | null => {
  if (!selectedReason) return null;
  if (selectedReason === otherLabel) {
    const custom = customReason.trim();
    return custom || null;
  }
  return selectedReason;
};
