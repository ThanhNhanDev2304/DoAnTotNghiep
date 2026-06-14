import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Filter, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  feedbackApi, FeedbackTypeLabel, FeedbackStatusLabel,
  type Feedback, type FeedbackStatus, type FeedbackType,
} from '@/api/feedback'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const STATUS_OPTIONS: FeedbackStatus[] = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']
const statusVariant: Record<FeedbackStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning', REVIEWING: 'default', RESOLVED: 'success', REJECTED: 'destructive',
}

const SENTIMENT_COLOR: Record<string, string> = {
  POSITIVE: 'text-green-400', NEGATIVE: 'text-red-400', NEUTRAL: 'text-gray-400',
}
const SENTIMENT_LABEL: Record<string, string> = {
  POSITIVE: 'Tích cực', NEGATIVE: 'Tiêu cực', NEUTRAL: 'Trung lập',
}

const HrFeedbacksPage: React.FC = () => {
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('')
  const [filterType, setFilterType] = useState<FeedbackType | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Feedback | null>(null)
  const [statusForm, setStatusForm] = useState<{ status: FeedbackStatus; hrNote: string }>({ status: 'REVIEWING', hrNote: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['hr-feedbacks', filterStatus, filterType, search, page],
    queryFn: () => feedbackApi.getAll({
      status: filterStatus || undefined,
      type: filterType || undefined,
      search: search || undefined,
      page, limit: 10,
    }),
  })
  const result = (data?.data as any)?.data ?? data?.data
  const feedbacks: Feedback[] = result?.items ?? []
  const total: number = result?.total ?? 0

  const { data: statsData } = useQuery({ queryKey: ['feedback-stats'], queryFn: feedbackApi.getStats })
  const stats = (statsData?.data as any)?.data ?? statsData?.data

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => feedbackApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-feedbacks'] })
      qc.invalidateQueries({ queryKey: ['feedback-stats'] })
      setSelected(null)
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })

  const openDetail = (f: Feedback) => { setSelected(f); setStatusForm({ status: f.status, hrNote: f.hrNote ?? '' }) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Phản hồi</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Xem và xử lý phản hồi từ người lao động</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tổng', value: stats.total, color: 'text-blue-400' },
            { label: 'Chờ xử lý', value: stats.byStatus?.pending, color: 'text-yellow-400' },
            { label: 'Đã giải quyết', value: stats.byStatus?.resolved, color: 'text-green-400' },
            { label: 'Từ chối', value: stats.byStatus?.rejected, color: 'text-red-400' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            className="flex-1 min-w-48 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <select
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm focus:outline-none"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1) }}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{FeedbackStatusLabel[s]}</option>)}
          </select>
          <select
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm focus:outline-none"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as any); setPage(1) }}
          >
            <option value="">Tất cả loại</option>
            {Object.entries(FeedbackTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(f)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{FeedbackTypeLabel[f.type]}</Badge>
                      {f.isAnonymous
                        ? <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]"><EyeOff className="h-3 w-3" /> Ẩn danh</span>
                        : <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]"><Eye className="h-3 w-3" /> {(f.user as any)?.fullName ?? (f.user as any)?.userName}</span>}
                      {f.department && <span className="text-xs text-[hsl(var(--muted-foreground))]">• {f.department.name}</span>}
                      {f.sentiment && (
                        <span className={`text-xs font-medium ${SENTIMENT_COLOR[f.sentiment]}`}>
                          {SENTIMENT_LABEL[f.sentiment]}
                        </span>
                      )}
                    </div>
                    <p className="font-medium truncate">{f.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">{f.content}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5">{new Date(f.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <Badge variant={statusVariant[f.status]} className="shrink-0">{FeedbackStatusLabel[f.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Không có phản hồi nào</p>
            </div>
          )}

          {total > 10 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <span className="flex items-center text-sm px-3">{page} / {Math.ceil(total / 10)}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Chi tiết phản hồi
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{FeedbackTypeLabel[selected.type]}</Badge>
                <Badge variant={statusVariant[selected.status]}>{FeedbackStatusLabel[selected.status]}</Badge>
                {selected.isAnonymous && <Badge variant="outline" className="gap-1"><EyeOff className="h-3 w-3" /> Ẩn danh</Badge>}
              </div>

              {!selected.isAnonymous && selected.user && (
                <div className="p-2 rounded-md bg-[hsl(var(--secondary))] text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Người gửi: </span>
                  <span className="font-medium">{(selected.user as any).fullName ?? (selected.user as any).userName}</span>
                  {(selected.user as any).employeeCode && <span className="text-[hsl(var(--muted-foreground))]"> ({(selected.user as any).employeeCode})</span>}
                </div>
              )}

              <div>
                <p className="font-semibold text-base mb-1">{selected.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{selected.content}</p>
              </div>

              {selected.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Đính kèm ({selected.attachments.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((a) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                        className="text-xs px-2 py-1 rounded bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary)/0.1)] transition-colors">
                        {a.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[hsl(var(--border))] pt-3 space-y-3">
                <Label className="text-sm">Cập nhật trạng thái</Label>
                <select
                  className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as FeedbackStatus })}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{FeedbackStatusLabel[s]}</option>)}
                </select>
                <textarea
                  className="w-full min-h-20 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none"
                  placeholder="Ghi chú của HR (hiển thị cho nhân viên)..."
                  value={statusForm.hrNote}
                  onChange={(e) => setStatusForm({ ...statusForm, hrNote: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            <Button
              onClick={() => selected && updateMut.mutate({ id: selected.id, data: statusForm })}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HrFeedbacksPage
