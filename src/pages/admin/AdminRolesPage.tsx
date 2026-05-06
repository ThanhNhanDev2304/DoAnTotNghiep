import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Shield, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { rolesApi, type CreateRolePayload, type UpdateRolePayload } from '@/api/roles'
import { toast } from 'sonner'

const schema = z.object({
  roleName: z.string().min(1, 'Vui lòng nhập tên role'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
})
type FormData = z.infer<typeof schema>

interface RoleItem {
  id: string
  roleName: string
  description?: string
  createdAt?: string
}

const AdminRolesPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [editRole, setEditRole] = useState<RoleItem | null>(null)
  const [deleteRole, setDeleteRole] = useState<RoleItem | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  })
  const roles: RoleItem[] = data?.data?.data ?? data?.data ?? []
  const filtered = roles.filter((r) => r.roleName.toLowerCase().includes(search.toLowerCase()))

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Tạo role thành công!')
      setCreateOpen(false)
      reset()
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Tạo role thất bại.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRolePayload }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Cập nhật role thành công!')
      setEditRole(null)
      reset()
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Cập nhật thất bại.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Xóa role thành công!')
      setDeleteRole(null)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Xóa thất bại.')
    },
  })

  const onCreateSubmit = (data: FormData) => createMutation.mutate(data)
  const onEditSubmit = (data: FormData) => {
    if (!editRole) return
    updateMutation.mutate({ id: editRole.id, data })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Quản lý Roles</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Quản lý hệ thống phân quyền</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { reset(); setCreateOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Tạo Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo Role mới</DialogTitle>
              <DialogDescription>Điền thông tin để tạo role mới trong hệ thống</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên Role</Label>
                <Input placeholder="VD: ADMIN, USER, MANAGER" {...register('roleName')} />
                {errors.roleName && <p className="text-xs text-[hsl(var(--destructive))]">{errors.roleName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Input placeholder="Mô tả quyền hạn của role này" {...register('description')} />
                {errors.description && <p className="text-xs text-[hsl(var(--destructive))]">{errors.description.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
                <Button type="submit" loading={isSubmitting}>Tạo Role</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input className="pl-10" placeholder="Tìm kiếm role..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[hsl(var(--secondary))] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((role) => (
            <Card key={role.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-[hsl(var(--primary)/0.15)]">
                    <Shield className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditRole(role); reset({ roleName: role.roleName, description: role.description || '' }) }}
                      className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteRole(role)}
                      className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Badge variant="default" className="mb-2">{role.roleName}</Badge>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{role.description || 'Không có mô tả'}</p>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy role nào</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Role</DialogTitle>
            <DialogDescription>Cập nhật thông tin role</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên Role</Label>
              <Input {...register('roleName')} />
              {errors.roleName && <p className="text-xs text-[hsl(var(--destructive))]">{errors.roleName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input {...register('description')} />
              {errors.description && <p className="text-xs text-[hsl(var(--destructive))]">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRole(null)}>Hủy</Button>
              <Button type="submit" loading={updateMutation.isPending}>Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteRole} onOpenChange={(o) => !o && setDeleteRole(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa role <strong className="text-[hsl(var(--foreground))]">{deleteRole?.roleName}</strong>?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRole(null)}>Hủy</Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteRole && deleteMutation.mutate(deleteRole.id)}
            >
              Xóa Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminRolesPage
