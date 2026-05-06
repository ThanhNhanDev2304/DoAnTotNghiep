import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Hồ sơ cá nhân',
  '/profile/change-password': 'Đổi mật khẩu',
  '/admin/users': 'Quản lý Users',
  '/admin/roles': 'Quản lý Roles',
}

const Header: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const title = routeTitles[location.pathname] || 'Tổng quan'

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.8)] backdrop-blur-sm sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] text-sm hover:text-[hsl(var(--foreground))] transition-colors">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Tìm kiếm...</span>
        </button>

        {/* Notification */}
        <button className="relative p-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
        </button>

        {/* Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-[hsl(var(--primary)/0.3)] hover:ring-[hsl(var(--primary))] transition-all">
          <AvatarImage src={user?.avatar ?? user?.avatarUrl} />
          <AvatarFallback className="text-xs">{getInitials(user?.userName || 'U')}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export default Header
