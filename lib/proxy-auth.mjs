import { verifyAdminSession } from '@bharatyatra/admin-auth';

export function hasValidAdminSession(token, env = process.env) {
  return Boolean(verifyAdminSession(token, env));
}