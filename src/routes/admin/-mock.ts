/** Sample data for admin pages */

export const MOCK_ANALYTICS = {
  totalUsers: 12_847,
  premiumUsers: 1_924,
  basicUsers: 10_923,
  activeLast7d: 3_102,
  newThisMonth: 412,
} as const;

export type MockUser = {
  id: string;
  name: string;
  email: string;
  plan: 'premium' | 'basic';
  status: 'active' | 'inactive' | 'suspended';
  joined: string;
  usageTokens: number;
};

export const MOCK_USERS: MockUser[] = [
  { id: '1', name: 'Alex Rivera', email: 'alex@example.com', plan: 'premium', status: 'active', joined: '2024-08-12', usageTokens: 128_420 },
  { id: '2', name: 'Jordan Lee', email: 'jordan@example.com', plan: 'basic', status: 'active', joined: '2025-01-03', usageTokens: 14_980 },
  { id: '3', name: 'Sam Taylor', email: 'sam@example.com', plan: 'premium', status: 'inactive', joined: '2023-11-20', usageTokens: 302_118 },
  { id: '4', name: 'Casey Morgan', email: 'casey@example.com', plan: 'basic', status: 'active', joined: '2025-03-01', usageTokens: 8_204 },
  { id: '5', name: 'Riley Chen', email: 'riley@example.com', plan: 'premium', status: 'active', joined: '2024-05-18', usageTokens: 96_443 },
  { id: '6', name: 'Morgan Blake', email: 'morgan@example.com', plan: 'basic', status: 'suspended', joined: '2024-12-07', usageTokens: 21_775 },
];

export function formatInt(n: number) {
  return n.toLocaleString();
}

/** Permission keys and display labels */
export const MOCK_PERMISSION_DEFS: { id: string; label: string }[] = [
  { id: 'users.view', label: 'View users' },
  { id: 'users.edit', label: 'Edit users' },
  { id: 'users.delete', label: 'Delete users' },
  { id: 'projects.view', label: 'View all projects' },
  { id: 'projects.edit', label: 'Edit any project' },
  { id: 'billing.view', label: 'View billing' },
  { id: 'billing.manage', label: 'Manage billing' },
  { id: 'admin.roles', label: 'Manage roles & permissions' },
  { id: 'admin.analytics', label: 'View analytics' },
];

export type MockRoleRow = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  permissionIds: string[];
};

export const MOCK_ROLES: MockRoleRow[] = [
  {
    id: 'super',
    name: 'Super admin',
    description: 'Full access to every feature and setting.',
    memberCount: 2,
    permissionIds: MOCK_PERMISSION_DEFS.map((p) => p.id),
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Create and edit content; no billing or role changes.',
    memberCount: 18,
    permissionIds: ['users.view', 'projects.view', 'projects.edit', 'admin.analytics'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to users and projects.',
    memberCount: 124,
    permissionIds: ['users.view', 'projects.view'],
  },
  {
    id: 'billing',
    name: 'Billing admin',
    description: 'Subscription and invoices only.',
    memberCount: 3,
    permissionIds: ['billing.view', 'billing.manage', 'users.view'],
  },
];
