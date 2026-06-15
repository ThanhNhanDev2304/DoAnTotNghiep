import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, CheckCircle2, UserPlus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  // Success state
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
        <div className="w-full max-w-sm text-center animate-scale-in">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Gửi yêu cầu thành công!</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
            Tài khoản của bạn đang chờ Admin xét duyệt.<br />
            Chúng tôi sẽ gửi email thông báo khi được duyệt.
          </p>
          <Link to="/login" className="mt-5 inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (same as LoginPage) */}
      <div className="hidden lg:flex lg:w-[38%] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
            <span className="text-white font-bold text-sm">UMC</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">UMC Electronics</p>
            <p className="text-white/60 text-xs">Phản hồi người lao động</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Tham gia<br />hệ thống
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-xs">
              Đăng ký tài khoản để bắt đầu gửi phản hồi, tham gia khảo sát và kết nối với bộ phận nhân sự.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              'Gửi phản hồi ẩn danh an toàn',
              'Tham gia khảo sát nội bộ',
              'Kiến nghị & khiếu nại minh bạch',
              'Hỏi đáp trực tiếp với HR',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © 2025 UMC Electronics. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
        <div className="min-h-full flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-md animate-slide-up">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
              <div className="h-9 w-9 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">UMC</span>
              </div>
              <p className="font-bold text-[hsl(var(--foreground))]">UMC Electronics</p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Đăng ký tài khoản</h2>
              <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Điền đầy đủ thông tin để gửi yêu cầu tạo tài khoản</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Account info section */}
              <div className="space-y-3 p-4 rounded-xl bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))]">
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Thông tin đăng nhập</p>

                <div className="space-y-1.5">
                  <Label htmlFor="userName" className="text-xs font-semibold">Tên đăng nhập <span className="text-red-500">*</span></Label>
                  <Input id="userName" placeholder="vd: nguyen_van_a" autoComplete="username" {...register('userName')} />
                  {errors.userName && <p className="text-xs text-red-500">{errors.userName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="email@example.com" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mật khẩu <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} placeholder="••••••" autoComplete="new-password" {...register('password')} />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Xác nhận MK <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input type={showCPw ? 'text' : 'password'} placeholder="••••••" autoComplete="new-password" {...register('confirmPassword')} />
                      <button
                        type="button"
                        onClick={() => setShowCPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                        aria-label={showCPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showCPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              </div>

              {/* Personal info section */}
              <div className="space-y-3 p-4 rounded-xl bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))]">
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Thông tin cá nhân (để Admin xét duyệt)</p>

                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')} />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">Số điện thoại</Label>
                    <Input id="phone" placeholder="0901234567" type="tel" {...register('phone')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="positionId" className="text-xs font-semibold">Chức vụ</Label>
                    <select
                      id="positionId"
                      className="w-full h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] transition-all"
                      {...register('positionId')}
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {positions.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    {...register('isIntern')}
                  />
                  <span className="text-sm text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                    Tôi là sinh viên thực tập
                  </span>
                </label>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? 'Đang gửi yêu cầu...' : (
                  <><UserPlus className="h-4 w-4" /><span>Gửi yêu cầu đăng ký</span></>
                )}
              </Button>

              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-[hsl(var(--primary))] font-semibold hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
