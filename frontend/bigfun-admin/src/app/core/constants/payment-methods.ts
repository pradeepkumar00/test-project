const LOGO_BASE = '/assets/payment-methods';

const METHOD_LOGOS: Record<string, string> = {
  UPI: `${LOGO_BASE}/upi.svg`,
  Paytm: `${LOGO_BASE}/paytm.svg`,
  PhonePe: `${LOGO_BASE}/phonepe.svg`,
  'Google Pay': `${LOGO_BASE}/google-pay.svg`,
  'Bank Transfer': `${LOGO_BASE}/bank-transfer.svg`,
  IMPS: `${LOGO_BASE}/imps.svg`,
  NEFT: `${LOGO_BASE}/neft.svg`,
};

export const getPaymentMethodLogo = (method: string): string =>
  METHOD_LOGOS[method] || `${LOGO_BASE}/bank-transfer.svg`;

export const formatMethodSelection = (methods: string[], placeholder: string): string => {
  if (!methods.length) return placeholder;
  if (methods.length === 1) return methods[0];
  return `${methods.length} methods selected`;
};
