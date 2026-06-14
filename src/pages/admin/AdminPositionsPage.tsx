import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { positionsApi, type Position } from '@/api/positions'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const AdminPositionsPage: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data, isLoading } = useQuery({ queryKey: ['positions'], queryFn: positionsApi.getAll })
  const positions: Position[] = (data?.data as any)?.data ?? data?.data ?? []

  const createMut = useMutation({
    mutationFn: positionsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); setOpen(false); toast.success('Tạo chức vụ thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Tạo thất bại')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => positionsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); setOpen(false); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })
  const deleteMut = useMutation({
    mutationFn: positionsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); toast.success('Đã xóa chức vụ') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Xóa thất bại')),
  })

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setOpen(true) }
  const openEdit = (p: Position) => { setEditing(p); setForm({ name: p.name, description: p.description ?? '' }); setOpen(true) }
  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Tên chức vụ là bắt buộc'); return }
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Chức vụ</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Danh sách chức vụ tại UMC Electronics</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Thêm chức vụ</Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((pos) => (
            <Card key={pos.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <CardTitle className="text-base">{pos.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(pos)} className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteMut.mutate(pos.id)} className="p-1.5 rounded hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              {pos.description && <CardContent><p className="text-sm text-[hsl(var(--muted-foreground))]">{pos.description}</p></CardContent>}
            </Card>
          ))}
          {positions.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" /> <p>Chưa có chức vụ nào</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tên chức vụ *</Label>
              <Input placeholder="Công nhân" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input placeholder="Mô tả chức vụ" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

export default AdminPositionsPage
