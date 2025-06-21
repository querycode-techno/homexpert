// Administrative roles that have access to admin panel
export const ADMINISTRATIVE_ROLES = ['admin', 'helpline', 'telecaller'];

// System roles configuration
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  HELPLINE: 'helpline', 
  TELECALLER: 'telecaller',
  VENDOR: 'vendor'
};

// Helper function to check if a role is administrative
export const isAdministrativeRole = (role) => {
  return ADMINISTRATIVE_ROLES.includes(role?.toLowerCase());
};

// Helper function to check if user has admin panel access
export const hasAdminAccess = (userRole) => {
  if (!userRole) return false;
  const roleName = typeof userRole === 'object' ? userRole.name : userRole;
  return isAdministrativeRole(roleName);
}; 