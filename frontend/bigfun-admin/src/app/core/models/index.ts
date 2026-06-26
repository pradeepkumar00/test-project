export interface Admin {
  id: string;
  name: string;
  mobile: string;
  role: 'admin' | 'superadmin';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  pendingDeposits: number;
  pendingWithdrawals: number;
  openBattles: number;
  runningBattles: number;
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface Deposit {
  _id: string;
  user: { _id: string; name: string; mobile: string; balance: number };
  amount: number;
  paymentMethod: string;
  utrNumber: string;
  status: string;
  orderId: string;
  rejectReason?: string;
  createdAt: string;
}

export interface Withdrawal {
  _id: string;
  user: {
    _id: string;
    name: string;
    mobile: string;
    balance: number;
    bankDetails?: Record<string, string>;
  };
  amount: number;
  method: string;
  status: string;
  upiId?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface Battle {
  id: string;
  gameType: string;
  entryFee: number;
  winningPrize: number;
  status: string;
  creator: { id: string; name: string; mobile: string };
  joiner?: { id: string; name: string; mobile: string } | null;
  winner?: { id: string; name: string; mobile: string } | null;
  createdAt: string;
}

export interface User {
  _id: string;
  mobile: string;
  name: string;
  referralCode: string;
  balance: number;
  bonusBalance: number;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  kyc?: { panNumber?: string; aadhaarNumber?: string; isVerified?: boolean };
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  user: { _id: string; name: string; mobile: string };
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  description?: string;
  createdAt: string;
}

export interface KycUser {
  _id: string;
  name: string;
  mobile: string;
  kyc: { panNumber: string; aadhaarNumber: string; isVerified: boolean };
  createdAt: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
}

export interface PlatformSettings {
  upiId: string;
  upiPayeeName: string;
  paymentLabel: string;
  minEntryFee: number;
  maxEntryFee: number;
  minDeposit: number;
  minWithdraw: number;
  referralBonus: number;
  currency: string;
  currencySymbol: string;
  supportEmail: string;
  paymentMethods: string[];
  withdrawMethods: string[];
  updatedAt?: string;
}
