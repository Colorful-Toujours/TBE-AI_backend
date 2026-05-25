export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'employee'
  | 'finance'
  | 'user';

export type PermissionKey =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'roles.manage'
  | 'bills.view'
  | 'bills.manage'
  | 'materials.view'
  | 'materials.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'settings.view'
  | 'settings.manage';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'dashboard.view',
  'users.view',
  'users.manage',
  'roles.manage',
  'bills.view',
  'bills.manage',
  'materials.view',
  'materials.manage',
  'payments.view',
  'payments.manage',
  'settings.view',
  'settings.manage',
];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    'dashboard.view',
    'users.view',
    'users.manage',
    'bills.view',
    'bills.manage',
    'materials.view',
    'materials.manage',
    'payments.view',
    'payments.manage',
    'settings.view',
  ],
  employee: [
    'dashboard.view',
    'bills.view',
    'bills.manage',
    'materials.view',
  ],
  finance: [
    'dashboard.view',
    'bills.view',
    'payments.view',
    'payments.manage',
  ],
  user: ['bills.view'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级管理',
  admin: '管理员',
  employee: '员工',
  finance: '财务',
  user: '用户',
};

export function getPermissionsForRole(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(
  role: UserRole,
  permission: PermissionKey,
): boolean {
  return getPermissionsForRole(role).includes(permission);
}
