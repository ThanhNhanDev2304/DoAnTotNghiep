import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { proposalApi, ProposalStatusLabel, type Proposal, type ProposalStatus } from '@/api/proposal'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const STATUS_OPTIONS: ProposalStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']
const statusVariant: Record<ProposalStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning', IN_PROGRESS: 'default', COMPLETED: 'success', REJECTED: 'destructive',
}

const HrProposalsPage: React.FC = () => {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Proposal | null>(null)
  const [form, setForm] = useState({ status: 'PENDING' as ProposalStatus, hrNote: '' })

  const { data, isLoading } = useQuery({ queryKey: ['hr-proposals', filter], queryFn: () => proposalApi.getAll(filter || undefined) })
  const proposals: Proposal[] = (data?.data as any)?.data ?? data?.data ?? []

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => proposalApi.updateStatus(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-proposals'] }); setSelected(null); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })

  const openDetail = (p: Proposal) => { setSelected(p); setForm({ status: p.status, hrNote: p.hrNote ?? '' }) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kiến nghị</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Xem xét và phản hồi các kiến nghị từ nhân viên</p>
        </div>
        <select className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ProposalStatusLabel[s]}</option>)}
        </select>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : proposals.length === 0 ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]"><Star className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Không có kiến nghị nào</p></div>
        : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(p)}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-1">{p.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>{p.user?.fullName ?? p.user?.userName}</span>
                        {p.user?.department && <><span>•</span><span>{p.user.department.name}</span></>}
                        <span>•</span><span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <Badge variant={statusVariant[p.status]} className="shrink-0">{ProposalStatusLabel[p.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Chi tiết kiến nghị</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div>
                <p className="font-semibold text-base mb-1">{selected.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-3 space-y-3">
                <select className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProposalStatus })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ProposalStatusLabel[s]}</option>)}
                </select>
                <textarea className="w-full min-h-20 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none" placeholder="Ghi chú phản hồi..." value={form.hrNote} onChange={(e) => setForm({ ...form, hrNote: e.target.value })} />
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

export default HrProposalsPage
