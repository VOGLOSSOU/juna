export enum UserRole {
  USER = 'USER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_PERMISSIONS = {
  [UserRole.USER]: [
    'read:subscriptions',
    'create:order',
    'read:own-orders',
    'update:own-order',
    'cancel:own-order',
    'create:proposal',
    'read:own-proposals',
    'update:own-proposal',
    'create:review',
    'read:own-reviews',
    'update:own-review',
    'delete:own-review',
    'create:ticket',
    'read:own-tickets',
    'read:own-notifications',
    'update:own-profile',
  ],

  [UserRole.PROVIDER]: [
    // Toutes les permissions USER
    ...['read:subscriptions', 'create:order', 'read:own-orders'],
    // Permissions spécifiques PROVIDER
    'create:subscription',
    'read:own-subscriptions',
    'update:own-subscription',
    'delete:own-subscription',
    'read:provider-orders',
    'update:provider-order-status',
    'scan:qr-code',
    'read:provider-stats',
  ],

  [UserRole.ADMIN]: [
    // Permissions USER
    'read:users',
    'update:user',
    'suspend:user',
    'ban:user',
    // Permissions SUBSCRIPTIONS
    'read:all-subscriptions',
    'approve:subscription',
    'reject:subscription',
    // Permissions PROPOSALS
    'read:all-proposals',
    'approve:proposal',
    'reject:proposal',
    // Permissions REVIEWS
    'read:all-reviews',
    'moderate:review',
    'delete:review',
    // Permissions TICKETS
    'read:all-tickets',
    'assign:ticket',
    'resolve:ticket',
    // Permissions PROVIDERS
    'read:providers',
    'approve:provider',
    'reject:provider',
    // Stats
    'read:stats',
    'generate:reports',
  ],

  [UserRole.SUPER_ADMIN]: [
    // Toutes les permissions ADMIN
    ...['read:users', 'update:user', 'suspend:user', 'ban:user'],
    // Permissions spécifiques SUPER_ADMIN
    'create:admin',
    'update:admin',
    'delete:admin',
    'manage:permissions',
    'manage:system-config',
    'read:logs',
    'manage:backups',
  ],
};

// Helper pour vérifier les permissions
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Helper pour vérifier si un rôle est supérieur ou égal à un autre
export const isRoleAtLeast = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.PROVIDER]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPER_ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};