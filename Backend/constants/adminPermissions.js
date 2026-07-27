/** Catalog of admin portal permissions. Superadmin always has all. */
const ADMIN_PERMISSIONS = [
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
];

const ALL_PERMISSION_KEYS = ADMIN_PERMISSIONS.map((p) => p.key);

const isValidPermission = (key) => ALL_PERMISSION_KEYS.includes(key);

const sanitizePermissions = (list = []) => {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(isValidPermission))];
};

const getEffectivePermissions = (admin) => {
  if (!admin) return [];
  if (admin.role === 'superadmin') return [...ALL_PERMISSION_KEYS];
  return sanitizePermissions(admin.permissions);
};

const hasPermission = (admin, permission) => {
  if (!admin) return false;
  if (admin.role === 'superadmin') return true;
  return getEffectivePermissions(admin).includes(permission);
};

const hasAnyPermission = (admin, permissions = []) =>
  permissions.some((p) => hasPermission(admin, p));

module.exports = {
  ADMIN_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  isValidPermission,
  sanitizePermissions,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
};
