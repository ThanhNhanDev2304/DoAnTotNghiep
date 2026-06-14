import React, { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Edit, Save, X, Lock, Mail, User, FileText, Shield, BadgeCheck, Phone, Clock, AlertTriangle, IdCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { getInitials, getApiErrorMessage } from '@/lib/utils'
import { getUserRoleName, normalizeUserProfile } from '@/lib/userProfile'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

// Schema cho nhân viên tự cập nhật
const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  phone: z.string().max(15, 'Tối đa 15 ký tự').optional().or(z.literal('')),
  description: z.string().max(500, 'Tối đa 500 ký tự').optional().or(z.literal('')),
})
type ProfileFormData = z.infer<typeof profileSchema>

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: profileResult, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
  })

  const profileFromQuery = profileResult?.user
  const rawProfile = profileFromQuery
    ? {
        ...profileFromQuery,
        avatarUrl: user?.avatarUrl ?? profileFromQuery.avatarUrl,
        backgroundUrl: user?.backgroundUrl ?? profileFromQuery.backgroundUrl,
      }
    : user
  const profile = rawProfile ? normalizeUserProfile(rawProfile) : user
  const roleName = getUserRoleName(profile)
  const isEmployee = roleName === 'EMPLOYEE'

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: (profile as any)?.fullName || '',
      phone: (profile as any)?.phone || '',
      description: profile?.description || '',
    },
  })

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      const updated = await authApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone || undefined,
        description: data.description || undefined,
      })
      setUser({ ...user!, ...updated })
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['profile'] })

      const pendingCode = (updated as any)?.pendingEmployeeCode
      if (pendingCode) {
        toast.info('Yêu cầu thay đổi mã nhân viên đã được gửi, chờ admin duyệt.')
      } else {
        toast.success('Cập nhật thông tin thành công!')
      }
      setEditing(false)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Cập nhật thất bại.'))
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'background') => {
    const setLoading = type === 'avatar' ? setUploadingAvatar : setUploadingBg
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('imgProfile', file)
      formData.append('typeImg', type)
      const updatedUser = await authApi.updateAvatar(formData)
      if (updatedUser) {
        const normalized = normalizeUserProfile(updatedUser)
        setUser(normalized)
        queryClient.setQueryData(['profile'], { user: normalized })
      }
      toast.success(type === 'avatar' ? 'Avatar đã được cập nhật!' : 'Ảnh bìa đã được cập nhật!')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Upload ảnh thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  const employeeCode = (profile as any)?.employeeCode
  const pendingEmployeeCode = (profile as any)?.pendingEmployeeCode
  const fullName = (profile as any)?.fullName
  const phone = (profile as any)?.phone
  const accountType = (profile as any)?.accountType
  const isGoogleAccount = accountType === 'google'

  const isProfileIncomplete = !fullName || !phone

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Mã nhân viên nổi bật cho tài khoản Google */}
      {isGoogleAccount && isEmployee && (
        <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-5 py-4">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
            <IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Mã nhân viên của bạn</p>
            {employeeCode ? (
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 tracking-widest mt-0.5">{employeeCode}</p>
            ) : (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">Chưa được cấp mã — chờ admin duyệt tài khoản</p>
            )}
          </div>
          {employeeCode && (
            <Badge variant="success" className="shrink-0">Đã xác nhận</Badge>
          )}
        </div>
      )}

      {/* Warning banner nếu profile chưa đầy đủ */}
      {isProfileIncomplete && !editing && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Thông tin chưa đầy đủ</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Vui lòng cập nhật {!fullName ? 'họ tên' : ''}{!fullName && !phone ? ' và ' : ''}{!phone ? 'số điện thoại' : ''} để sử dụng đầy đủ tính năng.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
            onClick={() => { setEditing(true); reset({ fullName: fullName || '', phone: phone || '', description: profile?.description || '' }) }}>
            Cập nhật ngay
          </Button>
        </div>
      )}

      {/* Cover & Avatar */}
      <Card className="overflow-hidden">
        <div
          className="h-40 relative gradient-primary group cursor-pointer"
          style={
            profile?.background
              ? { backgroundImage: `url(${profile.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
          onClick={() => bgRef.current?.click()}
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
          <input ref={bgRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'background')} />
        </div>

        <CardContent className="pt-0">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="relative group">
              <Avatar
                className="h-24 w-24 ring-4 ring-[hsl(var(--card))] cursor-pointer"
                onClick={() => avatarRef.current?.click()}
              >
                <AvatarImage src={profile?.avatar} className="object-cover" />
                <AvatarFallback className="text-2xl">{getInitials(profile?.userName || 'U')}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => avatarRef.current?.click()}>
                {uploadingAvatar
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Camera className="h-5 w-5 text-white" />}
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
            </div>
            <div className="flex-1 pb-1">
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">
                {fullName || profile?.userName}
              </h3>
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

      {/* Thông tin cá nhân */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật hồ sơ của bạn</CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => {
              setEditing(true)
              reset({
                fullName: fullName || '',
                phone: phone || '',
                description: profile?.description || '',
              })
            }}>
              <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Hủy
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="space-y-1.5">
                <Label><User className="h-3.5 w-3.5 inline mr-1.5" />Họ và tên <span className="text-red-500">*</span></Label>
                <Input placeholder="Nguyễn Văn A" {...register('fullName')} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label><Phone className="h-3.5 w-3.5 inline mr-1.5" />Số điện thoại</Label>
                <Input placeholder="0901234567" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label><FileText className="h-3.5 w-3.5 inline mr-1.5" />Giới thiệu bản thân</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Viết vài điều về bản thân..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <Button type="submit" loading={isSubmitting}>
                <Save className="h-4 w-4 mr-1" /> Lưu thay đổi
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Họ và tên', value: fullName || 'Chưa cập nhật', icon: User },
                { label: 'Tên đăng nhập', value: profile?.userName, icon: User },
                { label: 'Email', value: profile?.email, icon: Mail },
                { label: 'Role', value: roleName, icon: Shield },
                { label: 'Số điện thoại', value: phone || 'Chưa cập nhật', icon: Phone },
                { label: 'Giới thiệu', value: profile?.description || 'Chưa có giới thiệu', icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-secondary">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}

              {/* Mã nhân viên — hiển thị riêng với badge trạng thái */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-md bg-secondary">
                  <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Mã nhân viên</p>
                  {employeeCode ? (
                    <p className="text-sm font-medium flex items-center gap-2">
                      {employeeCode}
                      <Badge variant="success" className="text-xs">Đã xác nhận</Badge>
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 font-medium">Chưa có mã nhân viên</p>
                  )}
                  {pendingEmployeeCode && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Đang chờ duyệt: <strong>{pendingEmployeeCode}</strong>
                    </p>
                  )}
                  {!employeeCode && !pendingEmployeeCode && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cần có mã nhân viên để gửi phản hồi, khiếu nại.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật</CardTitle>
          <CardDescription>Quản lý mật khẩu và phiên đăng nhập</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mật khẩu</p>
                <p className="text-xs text-muted-foreground">Cập nhật mật khẩu của bạn</p>
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
