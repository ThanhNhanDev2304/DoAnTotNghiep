import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MessageSquare, ClipboardList, Star, AlertTriangle, Bell,
  TrendingUp, Heart, Users, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi } from '@/api/dashboard'
import { getInitials } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ElementType
  color: string
  to?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, color, to }) => {
  const content = (
    <Card className="hover:shadow-card-hover transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-[hsl(var(--primary))] group">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1 leading-tight">{value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return to ? <Link to={to} className="block">{content}</Link> : content
}

const EmployeeDashboard: React.FC = () => {
  const { data } = useQuery({ queryKey: ['employee-dashboard'], queryFn: dashboardApi.getEmployeeDashboard })
  const raw = (data?.data as any)?.data ?? data?.data
  const stats = raw?.stats ?? {}
  const announcements = raw?.announcements ?? []
  const pendingSurveys = raw?.pendingSurveys ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Phản hồi đã gửi" value={stats.myFeedbacks ?? 0} description="Tổng phản hồi" icon={MessageSquare} color="bg-blue-100 text-blue-600" to="/feedback/my" />
        <StatCard title="Khảo sát đã điền" value={stats.mySurveys ?? 0} description="Khảo sát hoàn thành" icon={ClipboardList} color="bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]" to="/surveys" />
        <StatCard title="Kiến nghị" value={stats.myProposals ?? 0} description="Đã gửi" icon={Star} color="bg-emerald-100 text-emerald-600" to="/proposals" />
        <StatCard title="Khiếu nại" value={stats.myComplaints ?? 0} description="Đã gửi" icon={AlertTriangle} color="bg-orange-100 text-orange-600" to="/complaints" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khảo sát chờ điền */}
        {pendingSurveys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                Khảo sát chờ bạn điền ({pendingSurveys.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingSurveys.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--secondary))]">
                  <p className="text-sm font-medium truncate flex-1">{s.title}</p>
                  <Button asChild size="sm" className="ml-2 shrink-0">
                    <Link to={`/surveys/${s.id}/fill`}>Điền ngay</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Thông báo mới nhất */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-[hsl(var(--primary))]" /> Thông báo mới nhất
              </CardTitle>
              <Link to="/announcements" className="text-xs text-[hsl(var(--primary))] hover:underline">Xem tất cả</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">Chưa có thông báo mới</p>
            ) : announcements.map((a: any) => (
              <Link key={a.id} to={`/announcements/${a.id}`} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                {a.isPinned && <Badge variant="outline" className="text-xs shrink-0">Ghim</Badge>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Thao tác nhanh</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/feedback/submit', icon: MessageSquare, label: 'Gửi phản hồi', color: 'text-blue-600' },
              { to: '/proposals/submit', icon: Star, label: 'Kiến nghị mới', color: 'text-emerald-600' },
              { to: '/complaints/submit', icon: AlertTriangle, label: 'Gửi khiếu nại', color: 'text-orange-600' },
              { to: '/evaluation', icon: BarChart3, label: 'Đánh giá tháng này', color: 'text-[hsl(var(--primary))]' },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--primary)/0.05)] transition-all cursor-pointer">
                  <a.icon className={`h-6 w-6 ${a.color}`} />
                  <span className="text-xs font-medium text-center">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const HrDashboard: React.FC = () => {
  const { data } = useQuery({ queryKey: ['dashboard-overview'], queryFn: dashboardApi.getOverview })
  const raw = (data?.data as any)?.data ?? data?.data
  const stats = raw?.stats ?? {}
  const pending = raw?.pending ?? {}
  const recentFeedbacks = raw?.recentFeedbacks ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Tổng nhân viên" value={stats.totalEmployees ?? 0} description="Người lao động" icon={Users} color="bg-blue-100 text-blue-600" to="/admin/users" />
        <StatCard title="Phản hồi" value={stats.totalFeedbacks ?? 0} description={`Chờ xử lý: ${pending.feedbacks ?? 0}`} icon={MessageSquare} color="bg-amber-100 text-amber-600" to="/hr/feedbacks" />
        <StatCard title="Kiến nghị" value={stats.totalProposals ?? 0} description={`Chờ xử lý: ${pending.proposals ?? 0}`} icon={Star} color="bg-emerald-100 text-emerald-600" to="/hr/proposals" />
        <StatCard title="Khiếu nại" value={stats.totalComplaints ?? 0} description={`Chờ xử lý: ${pending.complaints ?? 0}`} icon={AlertTriangle} color="bg-red-100 text-red-600" to="/hr/complaints" />
      </div>

      {/* Pending alerts */}
      {(pending.feedbacks > 0 || pending.proposals > 0 || pending.complaints > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <Bell className="h-4 w-4" />
              <span className="font-semibold text-sm">Cần xử lý hôm nay</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pending.feedbacks > 0 && <Link to="/hr/feedbacks" className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors font-medium">{pending.feedbacks} phản hồi chờ</Link>}
              {pending.proposals > 0 && <Link to="/hr/proposals" className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors font-medium">{pending.proposals} kiến nghị chờ</Link>}
              {pending.complaints > 0 && <Link to="/hr/complaints" className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors font-medium">{pending.complaints} khiếu nại chờ</Link>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent feedbacks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Phản hồi gần đây
              </CardTitle>
              <Link to="/hr/feedbacks" className="text-xs text-[hsl(var(--primary))] hover:underline">Xem tất cả</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentFeedbacks.map((f: any) => (
              <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{f.type}</span>
                    {f.department && <><span>•</span><span>{f.department.name}</span></>}
                  </div>
                </div>
                <Badge variant={f.status === 'RESOLVED' ? 'success' : f.status === 'PENDING' ? 'warning' : 'default'} className="shrink-0 text-xs">
                  {f.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Báo cáo nhanh</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: '/hr/reports', icon: Heart, label: 'Chỉ số sức khỏe phòng ban', desc: 'Health Score' },
              { to: '/hr/reports', icon: TrendingUp, label: 'Xu hướng phản hồi', desc: 'Trend analysis' },
              { to: '/hr/surveys', icon: ClipboardList, label: 'Kết quả khảo sát', desc: 'Survey results' },
            ].map((item) => (
              <Link key={item.to + item.label} to={item.to} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const role = user?.roleName?.toUpperCase() ?? user?.role?.roleName?.toUpperCase() ?? ''
  const isEmployee = role === 'EMPLOYEE'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden gradient-primary p-6 shadow-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-white/30">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
              {getInitials((user as any)?.fullName || user?.userName || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white/80 text-sm">Xin chào,</p>
            <h2 className="text-white text-2xl font-bold">{(user as any)?.fullName || user?.userName}</h2>
            <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">
              {role} — UMC Electronics Vietnam
            </Badge>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-4 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {isEmployee ? <EmployeeDashboard /> : <HrDashboard />}
    </div>
  )
}

export default DashboardPage
