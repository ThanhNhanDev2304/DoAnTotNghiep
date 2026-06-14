import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, User, LogOut, ChevronRight,
  MessageSquare, ClipboardList, Megaphone, Star, HelpCircle,
  Building2, Briefcase, Clock, BarChart3, FileText, AlertTriangle,
  Settings, UserCheck, Send,
} from 'lucide-react'
import { cn, getInitials, getApiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { notificationsApi } from '@/api/notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NavItem { to: string; icon: React.ElementType; label: string }

const commonItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Hồ sơ cá nhân' },
  { to: '/announcements', icon: Megaphone, label: 'Thông báo' },
]

const employeeItems: NavItem[] = [
  { to: '/feedback/submit', icon: MessageSquare, label: 'Gửi phản hồi' },
  { to: '/feedback/my', icon: ClipboardList, label: 'Phản hồi của tôi' },
  { to: '/surveys', icon: FileText, label: 'Khảo sát' },
  { to: '/proposals', icon: Star, label: 'Kiến nghị' },
  { to: '/complaints', icon: AlertTriangle, label: 'Khiếu nại' },
  { to: '/qna', icon: HelpCircle, label: 'Hỏi đáp' },
  { to: '/evaluation', icon: BarChart3, label: 'Đánh giá tháng này' },
]

const hrItems: NavItem[] = [
  { to: '/hr/feedbacks', icon: MessageSquare, label: 'Quản lý phản hồi' },
  { to: '/hr/surveys', icon: ClipboardList, label: 'Quản lý khảo sát' },
  { to: '/hr/proposals', icon: Star, label: 'Quản lý kiến nghị' },
  { to: '/hr/complaints', icon: AlertTriangle, label: 'Quản lý khiếu nại' },
  { to: '/hr/announcements', icon: Megaphone, label: 'Đăng thông báo' },
  { to: '/hr/qna', icon: HelpCircle, label: 'Hỏi đáp HR' },
  { to: '/hr/reports', icon: BarChart3, label: 'Báo cáo & Phân tích' },
]

const adminItems: NavItem[] = [
  { to: '/admin/pending-users', icon: UserCheck, label: 'Duyệt tài khoản' },
  { to: '/admin/users', icon: Users, label: 'Quản lý nhân viên' },
  { to: '/admin/departments', icon: Building2, label: 'Phòng ban' },
  { to: '/admin/positions', icon: Briefcase, label: 'Chức vụ' },
  { to: '/admin/shifts', icon: Clock, label: 'Ca làm việc' },
  { to: '/admin/roles', icon: Shield, label: 'Phân quyền' },
]

interface NavSectionProps {
  title: string
  items: NavItem[]
}

const NavSection: React.FC<NavSectionProps> = ({ title, items }) => (
  <>
    <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-3 mt-5 mb-2">
      {title}
    </p>
    {items.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
            isActive
              ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </NavLink>
    ))}
  </>
)

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sendOpen, setSendOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  const sendMutation = useMutation({
    mutationFn: notificationsApi.sendToHr,
    onSuccess: () => {
      toast.success('Đã gửi thông báo đến HR thành công')
      setSendOpen(false)
      setForm({ title: '', body: '' })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleSend = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (!form.body.trim()) { toast.error('Vui lòng nhập nội dung'); return }
    sendMutation.mutate(form)
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Đăng xuất thành công!')
  }

  const role = user?.roleName?.toUpperCase() ?? user?.role?.roleName?.toUpperCase() ?? ''
  const isAdmin = role === 'ADMIN'
  const isHR = role === 'HR'
  const isEmployee = role === 'EMPLOYEE'

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] z-30 sidebar-transition">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--border))]">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">UMC</span>
          </div>
          <div>
            <p className="font-bold text-[hsl(var(--foreground))] text-sm">UMC Electronics</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Hệ thống phản hồi NLĐ</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavSection title="Menu chính" items={commonItems} />

          {/* Employee section */}
          {(isEmployee || isAdmin) && (
            <NavSection title="Người lao động" items={employeeItems} />
          )}

          {/* HR section */}
          {(isHR || isAdmin) && (
            <NavSection title="Nhân sự (HR)" items={hrItems} />
          )}

          {/* Admin section */}
          {isAdmin && (
            <NavSection title="Quản trị hệ thống" items={adminItems} />
          )}
        </nav>

        {/* Gửi thông báo HR — chỉ hiện với EMPLOYEE */}
        {isEmployee && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setSendOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-all duration-200 border border-dashed border-[hsl(var(--border))]"
            >
              <Send className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Gửi thông báo cho HR</span>
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="p-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))]">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs">{getInitials(user?.userName || 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                {user?.fullName || user?.userName}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors p-1 rounded"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Dialog gửi thông báo */}
      <Dialog open={sendOpen} onOpenChange={(v) => { setSendOpen(v); if (!v) setForm({ title: '', body: '' }) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-500" /> Gửi thông báo đến HR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="VD: Yêu cầu xác nhận tăng ca"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung *</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Thông báo sẽ được gửi đến tất cả HR và Admin.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSendOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              Hủy
            </button>
            <Button onClick={handleSend} disabled={sendMutation.isPending} className="gap-2">
              <Send className="h-3.5 w-3.5" />
              {sendMutation.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Sidebar
