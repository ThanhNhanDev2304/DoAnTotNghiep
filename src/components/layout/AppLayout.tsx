import React, { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { AlertTriangle, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Header from './Header'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { getUserRoleName } from '@/lib/userProfile'
import { authApi } from '@/api/auth'

const ProfileCompleteGuard: React.FC = () => (
  <div className="flex items-center justify-center p-8 min-h-[60vh]">
    <div className="max-w-md w-full text-center space-y-5">
      <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Vui lòng hoàn thiện hồ sơ</h2>
        <p className="text-sm text-muted-foreground">
          Bạn cần cập nhật đầy đủ <strong>họ tên</strong> và <strong>số điện thoại</strong>{' '}
          trước khi sử dụng các tính năng của hệ thống.
        </p>
      </div>
      <Link to="/profile">
        <Button className="w-full max-w-xs">
          <User className="h-4 w-4 mr-2" />
          Cập nhật hồ sơ ngay
        </Button>
      </Link>
    </div>
  </div>
)

const AppLayout: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const roleName = getUserRoleName(user)
  const isEmployee = roleName === 'EMPLOYEE'
  const isOnProfilePage = location.pathname.startsWith('/profile')

  // Fetch full profile to get fullName / phone which are not in the JWT/store
  const { data: profileResult, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    staleTime: 5 * 60 * 1000,
    enabled: isEmployee,
  })

  const profileUser = profileResult?.user
  const fullName = (profileUser as any)?.fullName ?? (user as any)?.fullName
  const phone = (profileUser as any)?.phone ?? (user as any)?.phone
  const isProfileIncomplete = isEmployee && !isLoading && (!fullName || !phone)

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : 'var(--sidebar-width)' }}
      >
        <Header />
        <main className="flex-1 p-6 animate-fade-in">
          {isProfileIncomplete && !isOnProfilePage ? <ProfileCompleteGuard /> : <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
