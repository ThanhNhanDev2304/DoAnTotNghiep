import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { shiftsApi, type Shift } from '@/api/shifts'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const AdminShiftsPage: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [form, setForm] = useState({ name: '', startTime: '', endTime: '', description: '' })

  const { data, isLoading } = useQuery({ queryKey: ['shifts'], queryFn: shiftsApi.getAll })
  const shifts: Shift[] = (data?.data as any)?.data ?? data?.data ?? []

  const createMut = useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); setOpen(false); toast.success('Tạo ca làm việc thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Tạo thất bại')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => shiftsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); setOpen(false); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })
  const deleteMut = useMutation({
    mutationFn: shiftsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Đã xóa ca làm việc') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Xóa thất bại')),
  })

  const openCreate = () => { setEditing(null); setForm({ name: '', startTime: '', endTime: '', description: '' }); setOpen(true) }
  const openEdit = (s: Shift) => { setEditing(s); setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, description: s.description ?? '' }); setOpen(true) }
  const handleSubmit = () => {
    if (!form.name.trim() || !form.startTime || !form.endTime) { toast.error('Điền đầy đủ thông tin ca'); return }
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Ca làm việc</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">UMC Electronics — 2 ca sáng tối</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Thêm ca</Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                      <Clock className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{shift.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {shift.startTime} — {shift.endTime}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(shift)} className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteMut.mutate(shift.id)} className="p-1.5 rounded hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {shift.description && <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{shift.description}</p>}
                <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                  <Users className="h-4 w-4" />
                  <span>{shift._count?.users ?? 0} nhân viên</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa ca' : 'Thêm ca làm việc'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tên ca *</Label>
              <Input placeholder="Ca sáng" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu *</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc *</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input placeholder="Ca sáng (06:00 - 18:00)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminShiftsPage
