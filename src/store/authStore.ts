import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
  id: string
  userName: string
  email: string
  description?: string
  avatar?: string
  avatarUrl?: string
  background?: string
  backgroundUrl?: string
  accountType?: string
  roleName?: string
  roleId?: string
  googleId?: string | null
  role?: { id: string; roleName: string }
  createdAt?: string
}

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  pendingEmail: string | null
  setUser: (user: UserProfile | null) => void
  setAccessToken: (token: string | null) => void
  setPendingEmail: (email: string | null) => void
  login: (user: UserProfile, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      pendingEmail: null,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setPendingEmail: (pendingEmail) => set({ pendingEmail }),

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, pendingEmail: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
