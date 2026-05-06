import type { UserProfile } from '@/store/authStore'

export const normalizeUserProfile = (user: UserProfile): UserProfile => ({
  ...user,
  avatar: user.avatar ?? user.avatarUrl,
  background: user.background ?? user.backgroundUrl,
  role: user.role ?? (user.roleName ? { id: user.roleId ?? '', roleName: user.roleName } : undefined),
})

export const getUserRoleName = (user?: UserProfile | null) =>
  user?.role?.roleName ?? user?.roleName ?? 'USER'

export const isAdminUser = (user?: UserProfile | null) =>
  getUserRoleName(user).toUpperCase() === 'ADMIN'

