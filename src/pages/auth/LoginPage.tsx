import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/utils'
import { normalizeUserProfile } from '@/lib/userProfile'
import { toast } from 'sonner'

const schema = z.object({
  userNameOrEmail: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
type FormData = z.infer<typeof schema>

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.login(data)
      login(normalizeUserProfile(result.user), result.accessToken)
      toast.success(`Chào mừng trở lại, ${result.user.fullName || result.user.userName}!`)
      navigate('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'))
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 h-40 w-40 rounded-full bg-white/8" />

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
            <h1 className="text-4xl font-bold text-white leading-tight">
              Hệ thống<br />phản hồi NLĐ
            </h1>
            <p className="text-white/75 text-base leading-relaxed max-w-xs">
              Kênh giao tiếp minh bạch giữa nhân viên và bộ phận nhân sự — phản hồi, khảo sát, kiến nghị và hỏi đáp.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Phản hồi익명', 'Khảo sát', 'Kiến nghị', 'Hỏi đáp Q&A'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/40 text-xs">
          © 2025 UMC Electronics. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(var(--background))] px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">UMC</span>
            </div>
            <p className="font-bold text-[hsl(var(--foreground))]">UMC Electronics</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Đăng nhập</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Nhập thông tin để truy cập hệ thống</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userNameOrEmail" className="text-sm font-semibold">Tên đăng nhập / Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="userNameOrEmail"
                  placeholder="username hoặc email@example.com"
                  className="pl-9"
                  autoComplete="username"
                  {...register('userNameOrEmail')}
                />
              </div>
              {errors.userNameOrEmail && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.userNameOrEmail.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Mật khẩu</Label>
                <Link to="/forgot-password" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Đang đăng nhập...' : (
                <><span>Đăng nhập</span><ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[hsl(var(--background))] px-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Hoặc tiếp tục với</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => authApi.googleAuth()}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-white hover:bg-[hsl(var(--secondary))] transition-colors text-sm font-medium text-[hsl(var(--foreground))] cursor-pointer shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Đăng nhập với Google
          </button>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[hsl(var(--primary))] font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
