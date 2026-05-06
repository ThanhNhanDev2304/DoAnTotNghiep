import React, { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Edit, Save, X, Lock, Mail, User, FileText, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/users'
import { authApi } from '@/api/auth'
import { getInitials } from '@/lib/utils'
import { getUserRoleName, isAdminUser, normalizeUserProfile } from '@/lib/userProfile'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

const schema = z.object({
  userName: z.string().min(3, 'Tối thiểu 3 ký tự').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  description: z.string().max(200, 'Tối đa 200 ký tự'),
})
type FormData = z.infer<typeof schema>

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: profileData, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
  })
  const rawProfile = profileData?.data?.data?.user ?? profileData?.data?.user ?? profileData?.data?.data ?? profileData?.data ?? user
  const profile = rawProfile ? normalizeUserProfile(rawProfile) : user
  const canManageUsers = isAdminUser(user)
  const roleName = getUserRoleName(profile)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userName: profile?.userName, email: profile?.email, description: profile?.description || '' },
  })

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return
    if (!canManageUsers) {
      toast.error('Tai khoan hien tai khong co quyen cap nhat thong tin nguoi dung.')
      setEditing(false)
      return
    }
    try {
      await usersApi.update(user.id, { description: data.description, userName: data.userName, email: data.email })
      await refetch()
      const updated = { ...user, ...data }
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Cập nhật thông tin thành công!')
      setEditing(false)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Cập nhật thất bại.')
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'background') => {
    if (!user?.id) return
    if (!canManageUsers) {
      toast.error('Tai khoan hien tai khong co quyen cap nhat anh dai dien hoac anh bia.')
      return
    }
    const setLoading = type === 'avatar' ? setUploadingAvatar : setUploadingBg
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('imgProfile', file)
      formData.append('typeImg', type)
      await usersApi.updateAvatarOrBg(user.id, formData)
      await refetch()
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Ảnh nền'} đã được cập nhật!`)
    } catch {
      toast.error('Upload ảnh thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Cover & Avatar */}
      <Card className="overflow-hidden">
        <div
          className={`h-40 relative gradient-primary group ${canManageUsers ? 'cursor-pointer' : ''}`}
          style={profile?.background ? { backgroundImage: `url(${profile.background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          onClick={() => canManageUsers && bgRef.current?.click()}
        >
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
            <span className="text-white text-sm ml-2">Thay ảnh bìa</span>
          </div>
          {uploadingBg && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          <input
            ref={bgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'background')}
          />
        </div>

        <CardContent className="pt-0">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative group">
              <Avatar className={`h-24 w-24 ring-4 ring-[hsl(var(--card))] ${canManageUsers ? 'cursor-pointer' : ''}`} onClick={() => canManageUsers && avatarRef.current?.click()}>
                <AvatarImage src={profile?.avatar} className="object-cover" />
                <AvatarFallback className="text-2xl">{getInitials(profile?.userName || 'U')}</AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => canManageUsers && avatarRef.current?.click()}
              >
                {uploadingAvatar
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
              />
            </div>
            <div className="flex-1 pb-1">
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">{profile?.userName}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{profile?.email}</p>
            </div>
            <Badge variant={roleName === 'ADMIN' ? 'warning' : 'default'} className="mb-1">
              {roleName}
            </Badge>
          </div>

          {profile?.description && !editing && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] italic">{profile.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Quản lý thông tin hồ sơ của bạn</CardDescription>
          </div>
          {!editing && canManageUsers ? (
            <Button variant="outline" size="sm" onClick={() => { setEditing(true); reset({ userName: profile?.userName, email: profile?.email, description: profile?.description || '' }) }}>
              <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
            </Button>
          ) : editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Hủy
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label><User className="h-3.5 w-3.5 inline mr-1.5" />Tên đăng nhập</Label>
                <Input placeholder="Tên đăng nhập" {...register('userName')} />
                {errors.userName && <p className="text-xs text-[hsl(var(--destructive))]">{errors.userName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label><Mail className="h-3.5 w-3.5 inline mr-1.5" />Email</Label>
                <Input type="email" placeholder="Email" {...register('email')} />
                {errors.email && <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label><FileText className="h-3.5 w-3.5 inline mr-1.5" />Giới thiệu bản thân</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                  placeholder="Viết vài điều về bản thân..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-[hsl(var(--destructive))]">{errors.description.message}</p>}
              </div>
              <Button type="submit" loading={isSubmitting}>
                <Save className="h-4 w-4 mr-1" /> Lưu thay đổi
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Tên đăng nhập', value: profile?.userName, icon: User },
                { label: 'Email', value: profile?.email, icon: Mail },
                { label: 'Role', value: roleName, icon: Shield },
                { label: 'Giới thiệu', value: profile?.description || 'Chưa có giới thiệu', icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-[hsl(var(--secondary))]">
                    <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật</CardTitle>
          <CardDescription>Quản lý mật khẩu và phiên đăng nhập</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--secondary))]">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-sm font-medium">Mật khẩu</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Cập nhật mật khẩu của bạn</p>
              </div>
            </div>
            <Link to="/profile/change-password">
              <Button variant="outline" size="sm">Đổi mật khẩu</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
