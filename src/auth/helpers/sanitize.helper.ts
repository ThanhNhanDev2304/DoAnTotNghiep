// src/auth/helpers/sanitize.helper.ts
import { ISanitizedUser } from '@/auth/interfaces/auth.interface';

/** Remove sensitive fields (password, createdAt, ...) before returning to the client */
export function sanitizeUser(user: ISanitizedUser): ISanitizedUser {
  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    accountType: user.accountType,
    roleName: user.roleName,
    avatarUrl: user.avatarUrl,
    backgroundUrl: user.backgroundUrl,
    description: user.description,
    googleId: user.googleId,
    roleId: user.roleId,
  };
}