export const ADMIN_PERMISSIONS = [
  { key: 'dashboard.view', label: 'Dashboard', group: 'Dashboard', description: 'View dashboard stats' },
  { key: 'deposits.view', label: 'View deposits', group: 'Deposits', description: 'List deposit requests' },
  { key: 'deposits.manage', label: 'Approve / reject deposits', group: 'Deposits', description: 'Approve or reject deposits' },
  { key: 'withdrawals.view', label: 'View withdrawals', group: 'Withdrawals', description: 'List withdrawal requests' },
  { key: 'withdrawals.manage', label: 'Approve / reject withdrawals', group: 'Withdrawals', description: 'Approve or reject withdrawals' },
  { key: 'battles.view', label: 'View battles', group: 'Battles', description: 'List battles' },
  { key: 'battles.manage', label: 'Manage battles', group: 'Battles', description: 'Cancel, complete, or delete battles' },
  { key: 'users.view', label: 'View users', group: 'Users', description: 'List player accounts' },
  { key: 'users.manage', label: 'Activate / deactivate users', group: 'Users', description: 'Change user active status' },
  { key: 'users.balance', label: 'Adjust user balance', group: 'Users', description: 'Credit or debit wallet balance' },
  { key: 'kyc.view', label: 'View KYC', group: 'KYC', description: 'List pending KYC' },
  { key: 'kyc.manage', label: 'Approve / reject KYC', group: 'KYC', description: 'Approve or reject KYC submissions' },
  { key: 'transactions.view', label: 'View transactions', group: 'Transactions', description: 'List wallet transactions' },
  { key: 'settings.view', label: 'View settings', group: 'Settings', description: 'View platform settings' },
  { key: 'settings.manage', label: 'Edit settings', group: 'Settings', description: 'Update platform settings' },
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number]['key'];

export const ALL_PERMISSION_KEYS: AdminPermissionKey[] = ADMIN_PERMISSIONS.map((p) => p.key);

/** Route path → permission required to open the page */
export const ROUTE_PERMISSIONS: Record<string, AdminPermissionKey> = {
  '/dashboard': 'dashboard.view',
  '/settings': 'settings.view',
};

export function permissionsByGroup() {
  const groups: Record<string, typeof ADMIN_PERMISSIONS[number][]> = {};
  for (const p of ADMIN_PERMISSIONS) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  return groups;
}
