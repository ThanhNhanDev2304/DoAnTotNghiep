import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, User, LogOut,
  MessageSquare, ClipboardList, Megaphone, Star, HelpCircle,
  Building2, Briefcase, Clock, BarChart3, FileText, AlertTriangle,
  UserCheck, Send, PanelLeftClose, PanelLeftOpen,
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

interface NavSectionProps { title: string; items: NavItem[]; collapsed: boolean }

const NavSection: React.FC<NavSectionProps> = ({ title, items, collapsed }) => (
  <div className="mb-1">
    {collapsed
      ? <div className="mt-4 mb-1 mx-2 h-px bg-[hsl(var(--border))]" />
      : <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest px-3 mt-5 mb-1.5">{title}</p>
    }
    {items.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group',
            collapsed ? 'justify-center p-2 mx-1 mb-0.5' : 'gap-3 px-3 py-2',
            isActive
              ? 'bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] font-semibold'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className={cn(
              'flex items-center justify-center rounded-md transition-all duration-200 shrink-0',
              collapsed ? 'h-8 w-8' : 'h-7 w-7',
              isActive
                ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] group-hover:bg-[hsl(var(--primary)/0.1)] group-hover:text-[hsl(var(--primary))]'
            )}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            {!collapsed && <span className="flex-1 truncate text-[13px]">{label}</span>}
          </>
        )}
      </NavLink>
    ))}
  </div>
)

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
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
      <aside className={cn(
        'fixed left-0 top-0 h-screen flex flex-col bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-30 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-(--sidebar-width)'
      )}>
        {/* Logo + collapse button */}
        <div className={cn(
          'flex items-center border-b border-[hsl(var(--border))] shrink-0',
          collapsed ? 'flex-col gap-2 px-2 py-3' : 'gap-3 px-4 py-4'
        )}>
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-sm tracking-tight">UMC</span>
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[hsl(var(--foreground))] text-sm leading-tight truncate">UMC Electronics</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate font-medium">Phản hồi người lao động</p>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors shrink-0 cursor-pointer"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavSection title="Menu chính" items={commonItems} collapsed={collapsed} />
          {(isEmployee || isAdmin) && <NavSection title="Người lao động" items={employeeItems} collapsed={collapsed} />}
          {(isHR || isAdmin) && <NavSection title="Nhân sự (HR)" items={hrItems} collapsed={collapsed} />}
          {isAdmin && <NavSection title="Quản trị hệ thống" items={adminItems} collapsed={collapsed} />}
        </nav>

        {/* Send to HR — employee only */}
        {isEmployee && !collapsed && (
          <div className="px-3 pb-2 shrink-0">
            <button
              onClick={() => setSendOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)] hover:bg-[hsl(var(--primary)/0.12)] transition-all duration-200 border border-dashed border-[hsl(var(--primary)/0.3)] cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Gửi thông báo cho HR</span>
            </button>
          </div>
        )}

        {/* Send to HR — collapsed icon only */}
        {isEmployee && collapsed && (
          <div className="px-2 pb-2 shrink-0">
            <button
              onClick={() => setSendOpen(true)}
              title="Gửi thông báo cho HR"
              className="w-full flex justify-center p-2 rounded-lg text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)] hover:bg-[hsl(var(--primary)/0.12)] transition-all duration-200 border border-dashed border-[hsl(var(--primary)/0.3)] cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User footer */}
        <div className={cn('border-t border-[hsl(var(--border))] shrink-0', collapsed ? 'p-2' : 'p-3')}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0" title={user?.fullName || user?.userName}>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-[hsl(var(--primary))] text-white font-bold">
                  {getInitials(user?.userName || 'U')}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleLogout}
                className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[hsl(var(--secondary))]">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-[hsl(var(--primary))] text-white font-bold">
                  {getInitials(user?.userName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[hsl(var(--foreground))] truncate leading-tight">
                  {user?.fullName || user?.userName}
                </p>
                <p className="text-[11px] text-[hsl(var(--primary))] truncate font-medium">{role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Dialog gửi thông báo */}
      <Dialog open={sendOpen} onOpenChange={(v) => { setSendOpen(v); if (!v) setForm({ title: '', body: '' }) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="h-7 w-7 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                <Send className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              </span>
              Gửi thông báo đến HR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                placeholder="VD: Yêu cầu xác nhận tăng ca"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nội dung <span className="text-red-500">*</span></Label>
              <textarea
                className="w-full min-h-[96px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.25)] focus:border-[hsl(var(--primary))] transition-all"
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Sẽ gửi đến tất cả HR và Admin trong hệ thống.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSendOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleSend} disabled={sendMutation.isPending} className="gap-1.5">
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
