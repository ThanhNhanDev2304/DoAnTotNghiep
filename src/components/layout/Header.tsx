import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, X, Check, CheckCheck, Megaphone, ClipboardList, MessageSquare, FileText, AlertCircle, Send } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, getApiErrorMessage } from '@/lib/utils'
import { notificationsApi, type Notification } from '@/api/notifications'
import { searchApi, type SearchResults } from '@/api/search'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Hồ sơ cá nhân',
  '/profile/change-password': 'Đổi mật khẩu',
  '/admin/users': 'Quản lý Users',
  '/admin/roles': 'Quản lý Roles',
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  ANNOUNCEMENT: <Megaphone className="h-4 w-4 text-blue-500" />,
  SURVEY_PUBLISHED: <ClipboardList className="h-4 w-4 text-purple-500" />,
  ACCOUNT_APPROVED: <Check className="h-4 w-4 text-green-500" />,
  FEEDBACK_RESPONDED: <MessageSquare className="h-4 w-4 text-orange-500" />,
  PROPOSAL_STATUS: <FileText className="h-4 w-4 text-cyan-500" />,
  COMPLAINT_STATUS: <AlertCircle className="h-4 w-4 text-red-500" />,
  EMPLOYEE_REQUEST: <Send className="h-4 w-4 text-indigo-500" />,
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

// ─── Notification Dropdown ───────────────────────────────────────────────────

interface NotificationDropdownProps {
  onClose: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    retry: 1,
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      toast.success('Đã đánh dấu tất cả là đã đọc')
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const handleClick = (n: Notification) => {
    if (!n.isRead) markReadMutation.mutate(n.id)
    if (n.link) { navigate(n.link); onClose() }
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
        <span className="text-sm font-semibold">Thông báo {unread > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unread}</span>}</span>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors"
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Chưa có thông báo nào
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[hsl(var(--secondary))] transition-colors border-b border-[hsl(var(--border))/0.5] last:border-0 ${!n.isRead ? 'bg-primary/5' : ''}`}
            >
              <div className="mt-0.5 p-1.5 rounded-full bg-[hsl(var(--secondary))] shrink-0">
                {NOTIFICATION_ICONS[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Search Dialog ────────────────────────────────────────────────────────────

interface SearchDialogProps {
  onClose: () => void
}

const EMPTY_RESULTS: SearchResults = { announcements: [], surveys: [], qna: [], proposals: [], complaints: [] }

const SearchDialog: React.FC<SearchDialogProps> = ({ onClose }) => {
  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 400)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const { data: results = EMPTY_RESULTS, isFetching } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => searchApi.search(debouncedQ),
    enabled: debouncedQ.length >= 2,
  })

  const total = results.announcements.length + results.surveys.length + results.qna.length + results.proposals.length + results.complaints.length

  const go = (path: string) => { navigate(path); onClose() }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm kiếm thông báo, khảo sát, Q&A..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isFetching && (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!isFetching && debouncedQ.length >= 2 && total === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả cho "<strong>{debouncedQ}</strong>"
            </div>
          )}

          {!isFetching && total > 0 && (
            <div className="p-2 space-y-1">
              {results.announcements.length > 0 && (
                <ResultSection title="Thông báo">
                  {results.announcements.map(a => (
                    <ResultItem key={a.id} icon={<Megaphone className="h-3.5 w-3.5" />} label={a.title} onClick={() => go(`/announcements/${a.id}`)} />
                  ))}
                </ResultSection>
              )}
              {results.surveys.length > 0 && (
                <ResultSection title="Khảo sát">
                  {results.surveys.map(s => (
                    <ResultItem key={s.id} icon={<ClipboardList className="h-3.5 w-3.5" />} label={s.title} badge={s.status} onClick={() => go('/surveys')} />
                  ))}
                </ResultSection>
              )}
              {results.qna.length > 0 && (
                <ResultSection title="Hỏi & Đáp">
                  {results.qna.map(q => (
                    <ResultItem key={q.id} icon={<MessageSquare className="h-3.5 w-3.5" />} label={q.question} onClick={() => go('/qna')} />
                  ))}
                </ResultSection>
              )}
              {results.proposals.length > 0 && (
                <ResultSection title="Đề xuất">
                  {results.proposals.map(p => (
                    <ResultItem key={p.id} icon={<FileText className="h-3.5 w-3.5" />} label={p.content.slice(0, 60) + '...'} onClick={() => go('/proposals')} />
                  ))}
                </ResultSection>
              )}
              {results.complaints.length > 0 && (
                <ResultSection title="Khiếu nại">
                  {results.complaints.map(c => (
                    <ResultItem key={c.id} icon={<AlertCircle className="h-3.5 w-3.5" />} label={c.title} onClick={() => go('/complaints')} />
                  ))}
                </ResultSection>
              )}
            </div>
          )}

          {!debouncedQ || debouncedQ.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const ResultSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
    {children}
  </div>
)

const ResultItem: React.FC<{ icon: React.ReactNode; label: string; badge?: string; onClick: () => void }> = ({ icon, label, badge, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors text-left"
  >
    <span className="text-muted-foreground shrink-0">{icon}</span>
    <span className="flex-1 text-sm truncate">{label}</span>
    {badge && <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">{badge}</span>}
  </button>
)

// ─── Header ──────────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const title = routeTitles[location.pathname] || 'Tổng quan'

  const [showNotif, setShowNotif] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
    retry: 1,
  })

  // Close notification dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    if (showNotif) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotif])

  // Mở search bằng Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const closeSearch = useCallback(() => setShowSearch(false), [])

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] text-sm hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline text-xs">Tìm kiếm...</span>
            <kbd className="hidden lg:inline text-xs border border-border/60 rounded px-1 py-0.5 ml-1">Ctrl K</kbd>
          </button>

          {/* Notification */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative p-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
          </div>

          {/* Avatar */}
          <Avatar
            className="h-8 w-8 cursor-pointer ring-2 ring-[hsl(var(--primary)/0.3)] hover:ring-[hsl(var(--primary))] transition-all"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-xs bg-[hsl(var(--primary))] text-white font-bold">{getInitials(user?.userName || 'U')}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {showSearch && <SearchDialog onClose={closeSearch} />}
    </>
  )
}

export default Header
