export interface FirebaseConfig {
  enabled: boolean;
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
}

export interface WalletSyncPayload {
  balance: number;
  bonusBalance: number;
  totalBalance: number;
  income: number;
  reason: string;
  updatedAt: number;
  depositId?: string;
  withdrawId?: string;
}
