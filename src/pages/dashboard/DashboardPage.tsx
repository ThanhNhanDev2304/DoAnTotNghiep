import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Shield, UserCheck, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/users'
import { rolesApi } from '@/api/roles'
import { getInitials } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, color }) => (
  <Card className="hover:shadow-xl transition-shadow duration-300 animate-scale-in">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{title}</p>
          <p className="text-3xl font-bold text-[hsl(var(--foreground))] mt-1">{value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{description}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.getAll() })
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.getAll() })

  const users = usersData?.data?.data ?? usersData?.data ?? []
  const roles = rolesData?.data?.data ?? rolesData?.data ?? []
  const recentUsers = Array.isArray(users) ? users.slice(0, 5) : []

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden gradient-primary p-6 shadow-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-white/30">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
              {getInitials(user?.userName || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white/80 text-sm">Xin chào,</p>
            <h2 className="text-white text-2xl font-bold">{user?.userName} 👋</h2>
            <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">
              {user?.role?.roleName || 'User'}
            </Badge>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-4 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Users"
          value={Array.isArray(users) ? users.length : 0}
          description="Người dùng đã đăng ký"
          icon={Users}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          title="Roles"
          value={Array.isArray(roles) ? roles.length : 0}
          description="Phân quyền hệ thống"
          icon={Shield}
          color="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          title="Đang hoạt động"
          value={Array.isArray(users) ? users.length : 0}
          description="Users đang online"
          icon={UserCheck}
          color="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Hoạt động hôm nay"
          value="--"
          description="Lượt truy cập hôm nay"
          icon={Activity}
          color="bg-orange-500/15 text-orange-400"
        />
      </div>

      {/* Recent Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Người dùng gần đây</CardTitle>
          <CardDescription>Danh sách người dùng mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có dữ liệu người dùng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u: { id: string; userName: string; email: string; avatar?: string; role?: { roleName: string } }) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-xs">{getInitials(u.userName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{u.userName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{u.email}</p>
                  </div>
                  <Badge variant={u.role?.roleName === 'ADMIN' ? 'warning' : 'default'}>
                    {u.role?.roleName || 'USER'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
