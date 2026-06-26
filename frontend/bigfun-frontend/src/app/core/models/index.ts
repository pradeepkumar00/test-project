export interface User {
  id: string;
  mobile: string;
  name: string;
  referralCode: string;
  balance: number;
  bonusBalance: number;
  totalBalance: number;
  income?: number;
  gamesWon?: number;
  gamesPlayed?: number;
  isVerified: boolean;
  kycVerified?: boolean;
  referralCount: number;
  referralEarnings: number;
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
}

export interface Battle {
  id: string;
  gameType: string;
  entryFee: number;
  winningPrize: number;
  totalPool: number;
  platformFee: number;
  status: 'open' | 'running' | 'completed' | 'cancelled';
  creator: { id: string; name: string; mobile: string } | null;
  joiner: { id: string; name: string; mobile: string } | null;
  title?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: T | boolean | string | undefined;
}

export interface HomeData {
  walletBalance: number;
  income: number;
  kyc: { status: string; message: string };
  tournaments: { slug: string; name: string; status: string }[];
  platformFeePercent: number;
}

export interface PaymentDetails {
  label: string;
  upiId: string;
  upiQrImage: string;
  minDeposit: number;
  instructions: string;
}

export interface DepositQr {
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  qrDataUrl: string;
  upiUri: string;
  expiresInMinutes: number;
}

export interface WalletDeposit {
  _id: string;
  amount: number;
  status: string;
  orderId: string;
  paymentMethod?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface WalletWithdrawal {
  _id: string;
  amount: number;
  status: string;
  method: string;
  rejectReason?: string;
  createdAt: string;
}

export interface RealtimeSyncConfig {
  firebaseEnabled: boolean;
  walletPollingEnabled: boolean;
  battlesPollingEnabled: boolean;
  walletPollIntervalMs: number;
  battlesPollIntervalMs: number;
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
  } | null;
}

export interface AppSettings {
  appName: string;
  currency: string;
  currencySymbol: string;
  minDeposit: number;
  minWithdraw: number;
  referralBonus: number;
  minEntryFee: number;
  maxEntryFee: number;
  paymentMethods: string[];
  withdrawMethods: string[];
  supportEmail: string;
  realtime: RealtimeSyncConfig;
}
