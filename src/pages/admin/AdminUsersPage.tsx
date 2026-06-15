import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Search, Users, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { usersApi, type CreateUserPayload } from '@/api/users'
import { rolesApi } from '@/api/roles'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const createSchema = z.object({
  userName: z.string().min(3, 'Tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  roleName: z.string().min(1, 'Chọn một role'),
})
const editSchema = z.object({
  description: z.string(),
  userName: z.string().min(3, 'Tối thiểu 3 ký tự').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
})
const roleSchema = z.object({ roleNameOrId: z.string().min(1, 'Chọn một role') })

type CreateData = z.infer<typeof createSchema>
type EditData = z.infer<typeof editSchema>
type RoleData = z.infer<typeof roleSchema>

interface UserItem {
  id: string
  userName: string
  email: string
  fullName?: string
  avatar?: string
  description?: string
  role?: { id: string; roleName: string }
  createdAt?: string
}

const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [roleUser, setRoleUser] = useState<UserItem | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.getAll() })
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.getAll() })

  const users: UserItem[] = data?.data?.data ?? data?.data ?? []
  const roles: { id: string; roleName: string }[] = rolesData?.data?.data ?? rolesData?.data ?? []
  const filtered = users.filter(
    (u) => u.userName.toLowerCase().includes(search.toLowerCase()) ||
           u.email.toLowerCase().includes(search.toLowerCase())
  )

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) })
  const roleForm = useForm<RoleData>({ resolver: zodResolver(roleSchema) })

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Tạo user thành công!'); setCreateOpen(false); createForm.reset() },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Tạo user thất bại.') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditData }) => usersApi.update(id, { description: data.description, userName: data.userName, email: data.email }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Cập nhật thành công!'); setEditUser(null) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Cập nhật thất bại.') },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleData }) => usersApi.updateRole(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Cập nhật role thành công!'); setRoleUser(null) },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.error(e?.response?.data?.message || 'Cập nhật role thất bại.') },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Quản lý Users</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {users.length} người dùng trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { createForm.reset(); setCreateOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Tạo User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo User mới</DialogTitle>
              <DialogDescription>Thêm người dùng mới vào hệ thống</DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập</Label>
                <Input placeholder="johndoe" {...createForm.register('userName')} />
                {createForm.formState.errors.userName && <p className="text-xs text-[hsl(var(--destructive))]">{createForm.formState.errors.userName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input placeholder="email@example.com" {...createForm.register('email')} />
                {createForm.formState.errors.email && <p className="text-xs text-[hsl(var(--destructive))]">{createForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <Input type="password" placeholder="••••••" {...createForm.register('password')} />
                {createForm.formState.errors.password && <p className="text-xs text-[hsl(var(--destructive))]">{createForm.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" {...createForm.register('roleName')}>
                  <option value="">Chọn role</option>
                  {roles.map((r) => <option key={r.id} value={r.roleName}>{r.roleName}</option>)}
                </select>
                {createForm.formState.errors.roleName && <p className="text-xs text-[hsl(var(--destructive))]">{createForm.formState.errors.roleName.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
                <Button type="submit" loading={createMutation.isPending}>Tạo User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input className="pl-10" placeholder="Tìm kiếm theo tên, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách người dùng</CardTitle>
          <CardDescription>Tổng cộng {filtered.length} kết quả</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-[hsl(var(--secondary))] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--muted))] transition-colors group">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-xs">{getInitials(u.userName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{u.fullName || u.userName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{u.email}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setRoleUser(u); roleForm.setValue('roleNameOrId', u.role?.roleName || '') }}
                      className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
                      title="Đổi Role"
                    ><Shield className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={() => { setEditUser(u); editForm.reset({ userName: u.userName, email: u.email, description: u.description || '' }) }}
                      className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] transition-colors"
                      title="Chỉnh sửa"
                    ><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa User</DialogTitle>
            <DialogDescription>Cập nhật thông tin người dùng</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => editUser && updateMutation.mutate({ id: editUser.id, data: d }))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tên đăng nhập</Label>
              <Input {...editForm.register('userName')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...editForm.register('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Giới thiệu</Label>
              <Input {...editForm.register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
              <Button type="submit" loading={updateMutation.isPending}>Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={!!roleUser} onOpenChange={(o) => !o && setRoleUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi Role</DialogTitle>
            <DialogDescription>Cập nhật quyền hạn cho <strong>{roleUser?.userName}</strong></DialogDescription>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit((d) => roleUser && roleMutation.mutate({ id: roleUser.id, data: d }))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Role mới</Label>
              <select className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" {...roleForm.register('roleNameOrId')}>
                <option value="">Chọn role</option>
                {roles.map((r) => <option key={r.id} value={r.roleName}>{r.roleName}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleUser(null)}>Hủy</Button>
              <Button type="submit" loading={roleMutation.isPending}>Cập nhật Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default AdminUsersPage
