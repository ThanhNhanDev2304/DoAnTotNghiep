import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import OtpInput from '@/components/shared/OtpInput'
import { authApi } from '@/api/auth'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

type Step = 1 | 2

const step1Schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

const step2Schema = z
  .object({
    otp: z.string().length(6, 'OTP phải có đúng 6 chữ số'),
    newPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự').max(50, 'Mật khẩu tối đa 50 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>(1)
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const navigate = useNavigate()

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '' },
  })

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  })

  const onStep1 = async (data: Step1Data) => {
    try {
      await authApi.sendChangePasswordOtp({ email: data.email })
      setPendingEmail(data.email)
      toast.success('Mã OTP đã được gửi đến email của bạn!')
      setStep(2)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Không thể gửi OTP. Vui lòng thử lại.'))
    }
  }

  const onStep2 = async (data: Step2Data) => {
    try {
      await authApi.verifyChangePasswordOtp({
        email: pendingEmail,
        otp,
        newPassword: data.newPassword,
      })
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'OTP không hợp lệ hoặc đã hết hạn.'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[hsl(var(--primary)/0.1)] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-4 animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">Quên mật khẩu</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Đặt lại mật khẩu qua email</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {([1, 2] as Step[]).map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-all ${
                  s === step
                    ? 'gradient-primary text-white'
                    : s < step
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div
                  className={`h-0.5 flex-1 transition-all ${step > s ? 'bg-green-500' : 'bg-[hsl(var(--border))]'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {step === 1 ? 'Xác minh email' : 'Đặt mật khẩu mới'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Nhập email để nhận mã OTP xác minh'
                : `Nhập OTP từ email ${pendingEmail} và mật khẩu mới`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-10"
                      {...form1.register('email')}
                    />
                  </div>
                  {form1.formState.errors.email && (
                    <p className="text-xs text-[hsl(var(--destructive))]">
                      {form1.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" size="lg" loading={form1.formState.isSubmitting}>
                  Gửi mã OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-5">
                <div className="space-y-2">
                  <Label className="block text-center">Nhập mã OTP (6 chữ số)</Label>
                  <OtpInput
                    value={otp}
                    onChange={(v) => {
                      setOtp(v)
                      form2.setValue('otp', v)
                    }}
                  />
                  {form2.formState.errors.otp && (
                    <p className="text-xs text-[hsl(var(--destructive))] text-center">
                      {form2.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...form2.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form2.formState.errors.newPassword && (
                    <p className="text-xs text-[hsl(var(--destructive))]">
                      {form2.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10"
                      {...form2.register('confirmPassword')}
                    />
                  </div>
                  {form2.formState.errors.confirmPassword && (
                    <p className="text-xs text-[hsl(var(--destructive))]">
                      {form2.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" loading={form2.formState.isSubmitting}>
                  Đặt lại mật khẩu
                </Button>
              </form>
            )}

            <div className="mt-4 text-center space-y-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 mx-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại bước 1
                </button>
              )}
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Nhớ mật khẩu rồi?{' '}
                <Link to="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
