import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { complaintApi, ComplaintTypeLabel, ComplaintStatusLabel, type Complaint, type ComplaintStatus } from '@/api/complaint'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const STATUS_OPTIONS: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']
const statusVariant: Record<ComplaintStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning', IN_PROGRESS: 'default', RESOLVED: 'success', REJECTED: 'destructive',
}

const HrComplaintsPage: React.FC = () => {
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [form, setForm] = useState({ status: 'PENDING' as ComplaintStatus, hrNote: '' })

  const { data, isLoading } = useQuery({ queryKey: ['hr-complaints', filterStatus], queryFn: () => complaintApi.getAll(filterStatus || undefined) })
  const complaints: Complaint[] = (data?.data as any)?.data ?? data?.data ?? []

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => complaintApi.updateStatus(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-complaints'] }); setSelected(null); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })

  const openDetail = (c: Complaint) => { setSelected(c); setForm({ status: c.status, hrNote: c.hrNote ?? '' }) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khiếu nại</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Xử lý khiếu nại từ người lao động</p>
        </div>
        <select className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ComplaintStatusLabel[s]}</option>)}
        </select>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : complaints.length === 0 ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]"><AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Không có khiếu nại nào</p></div>
        : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(c)}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{ComplaintTypeLabel[c.type]}</Badge>
                      </div>
                      <p className="font-medium truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>{c.user?.fullName ?? c.user?.userName}</span>
                        {c.user?.department && <><span>•</span><span>{c.user.department.name}</span></>}
                        <span>•</span><span>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <Badge variant={statusVariant[c.status]} className="shrink-0">{ComplaintStatusLabel[c.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Chi tiết khiếu nại</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex gap-2"><Badge variant="outline">{ComplaintTypeLabel[selected.type]}</Badge></div>
              <div>
                <p className="font-semibold text-base mb-1">{selected.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-3 space-y-3">
                <select className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ComplaintStatus })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ComplaintStatusLabel[s]}</option>)}
                </select>
                <textarea className="w-full min-h-20 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none" placeholder="Ghi chú HR..." value={form.hrNote} onChange={(e) => setForm({ ...form, hrNote: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            <Button onClick={() => selected && updateMut.mutate({ id: selected.id, data: form })} disabled={updateMut.isPending}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HrComplaintsPage
