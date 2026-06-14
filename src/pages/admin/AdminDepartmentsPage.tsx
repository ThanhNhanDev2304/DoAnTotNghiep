import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { departmentsApi, type CreateDepartmentDto, type Department } from '@/api/departments'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const EMPTY_FORM: CreateDepartmentDto = { name: '', code: '', description: '' }

const AdminDepartmentsPage: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<CreateDepartmentDto>(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })
  const departments: Department[] = (data?.data as any)?.data ?? data?.data ?? []

  const createMut = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setOpen(false); toast.success('Tạo phòng ban thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Tạo thất bại')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentDto> }) => departmentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setOpen(false); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })

  const deleteMut = useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Đã xóa phòng ban') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Xóa thất bại')),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  const openEdit = (dept: Department) => { setEditing(dept); setForm({ name: dept.name, code: dept.code, description: dept.description ?? '' }); setOpen(true) }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Tên và mã phòng ban là bắt buộc'); return }
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Quản lý Phòng ban</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Quản lý các phòng ban tại UMC Electronics</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm phòng ban
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{dept.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-0.5">{dept.code}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteMut.mutate(dept.id)} className="p-1.5 rounded hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dept.description && <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{dept.description}</p>}
                <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                  <Users className="h-4 w-4" />
                  <span>{dept._count?.users ?? 0} nhân viên</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {departments.length === 0 && (
            <div className="col-span-3 text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có phòng ban nào</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tên phòng ban *</Label>
              <Input placeholder="QA" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Mã phòng ban *</Label>
              <Input placeholder="QA01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input placeholder="Phòng kiểm soát chất lượng" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

export default AdminDepartmentsPage
