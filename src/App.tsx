import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages - lazy loaded for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))
const GoogleCallbackPage = React.lazy(() => import('./pages/auth/GoogleCallbackPage'))
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'))
const VerifyOtpPage = React.lazy(() => import('./pages/auth/VerifyOtpPage'))
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'))
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'))
const ChangePasswordPage = React.lazy(() => import('./pages/profile/ChangePasswordPage'))
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminRolesPage = React.lazy(() => import('./pages/admin/AdminRolesPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang tải...</p>
    </div>
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/verify-otp" element={<VerifyOtpPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/change-password" element={<ChangePasswordPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/roles" element={<AdminRolesPage />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: 'hsl(222 47% 14%)',
            border: '1px solid hsl(222 40% 22%)',
            color: 'hsl(213 31% 91%)',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
