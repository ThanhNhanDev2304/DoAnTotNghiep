import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.login(data)
      login(normalizeUserProfile(result.user), result.accessToken)
      toast.success(`Chào mừng trở lại, ${result.user.userName}!`)
      navigate('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[hsl(var(--primary)/0.1)] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-4 animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
            <span className="text-white font-bold text-xl">AP</span>
          </div>
          <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">AppProject</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Hệ thống quản lý dự án</p>
        </div>

        <Card className="shadow-2xl border-[hsl(var(--border))]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin tài khoản để tiếp tục</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="userNameOrEmail">Tên đăng nhập hoặc Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    id="userNameOrEmail"
                    placeholder="username hoặc email@example.com"
                    className="pl-10"
                    {...register('userNameOrEmail')}
                  />
                </div>
                {errors.userNameOrEmail && (
                  <p className="text-xs text-[hsl(var(--destructive))]">
                    {errors.userNameOrEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[hsl(var(--primary))] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[hsl(var(--destructive))]">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Đăng nhập
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[hsl(var(--card))] px-2 text-[hsl(var(--muted-foreground))]">
                  Hoặc
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => authApi.googleAuth()}
            >
              Đăng nhập với Google
            </Button>

            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-[hsl(var(--primary))] font-medium hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
