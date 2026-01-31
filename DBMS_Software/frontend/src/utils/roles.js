/**
 * Centralized role constants and helpers.
 * DB roles: admin | student | guardian (do not rename in DB).
 */

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  GUARDIAN: 'guardian',
};

export const ROLES_LIST = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.STUDENT, label: 'Student' },
  { value: ROLES.GUARDIAN, label: 'Parent' },
];

/** Roles that share the same dashboard (Student + Parent/Guardian). */
export const DASHBOARD_ROLES = [ROLES.STUDENT, ROLES.GUARDIAN];

export function isAdmin(role) {
  return (role || '').toString().toLowerCase() === ROLES.ADMIN;
}

/** Redirect path after login/signup: Admin → /admin/dashboard, Student/Parent → /dashboard */
export function getDashboardPath(role) {
  const r = (role || '').toString().toLowerCase();
  return isAdmin(r) ? '/admin/dashboard' : '/dashboard';
}
