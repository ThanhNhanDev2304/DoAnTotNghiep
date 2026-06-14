import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/api/auth'
import { positionsApi } from '@/api/positions'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

const schema = z.object({
  userName: z.string().min(3, 'Tên đăng nhập ít nhất 3 ký tự').regex(/^[a-zA-Z0-9_]+$/, 'Chỉ dùng chữ, số, gạch dưới'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
  phone: z.string().optional(),
  positionId: z.string().optional(),
  isIntern: z.boolean().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const RegisterPage: React.FC = () => {
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isIntern: false },
  })

  const { data: posData } = useQuery({ queryKey: ['positions-public'], queryFn: positionsApi.getAll })
  const positions = (posData?.data as any)?.data ?? posData?.data ?? []

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.register({
        userName: data.userName,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        positionId: data.positionId || undefined,
        isIntern: data.isIntern,
      })
      setDone(true)
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Đăng ký thất bại'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Đăng ký thành công!</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Tài khoản của bạn đang chờ admin xét duyệt.<br />
              Chúng tôi sẽ gửi email thông báo khi tài khoản được duyệt.
            </p>
            <Link to="/login">
              <Button variant="outline" className="mt-2 w-full">Quay lại đăng nhập</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
          <CardDescription>Điền đầy đủ thông tin để gửi yêu cầu tạo tài khoản</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Thông tin đăng nhập */}
            <div className="space-y-1.5">
              <Label>Tên đăng nhập *</Label>
              <Input placeholder="vd: nguyen_van_a" {...register('userName')} />
              {errors.userName && <p className="text-xs text-red-500">{errors.userName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="email@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mật khẩu *</Label>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} placeholder="••••••" {...register('password')} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <Input type={showCPw ? 'text' : 'password'} placeholder="••••••" {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowCPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                    {showCPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Thông tin cá nhân */}
            <div className="pt-1 border-t border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 mt-2">Thông tin để admin xét duyệt</p>

              <div className="space-y-1.5">
                <Label>Họ và tên *</Label>
                <Input placeholder="Nguyễn Văn A" {...register('fullName')} />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5 mt-3">
                <Label>Số điện thoại</Label>
                <Input placeholder="0901234567" {...register('phone')} />
              </div>

              <div className="space-y-1.5 mt-3">
                <Label>Chức vụ</Label>
                <select className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" {...register('positionId')}>
                  <option value="">-- Chọn chức vụ --</option>
                  {positions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" id="isIntern" className="rounded" {...register('isIntern')} />
                <Label htmlFor="isIntern" className="font-normal cursor-pointer">
                  Tôi là sinh viên thực tập
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
            </Button>

            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage
