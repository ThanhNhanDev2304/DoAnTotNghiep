import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import OtpInput from '@/components/shared/OtpInput'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

type Step = 1 | 2

const step1Schema = z.object({ email: z.string().email('Email không hợp lệ') })
const step2Schema = z.object({
  otp: z.string().length(6, 'OTP phải có 6 chữ số'),
  newPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const ChangePasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>(1)
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingEmail, setPending] = useState('')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: user?.email || '' },
  })

  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const onStep1 = async (data: Step1Data) => {
    try {
      await authApi.sendChangePasswordOtp({ email: data.email })
      setPending(data.email)
      toast.success('Mã OTP đã được gửi đến email!')
      setStep(2)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Không thể gửi OTP.')
    }
  }

  const onStep2 = async (data: Step2Data) => {
    try {
      await authApi.verifyChangePasswordOtp({ email: pendingEmail, otp, newPassword: data.newPassword })
      toast.success('Đổi mật khẩu thành công!')
      navigate('/profile')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'OTP không hợp lệ.')
    }
  }

  return (
    <div className="max-w-md mx-auto animate-slide-up">
      <button
        onClick={() => step === 2 ? setStep(1) : navigate('/profile')}
        className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 2 ? 'Quay lại bước 1' : 'Quay lại hồ sơ'}
      </button>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-all ${
              s === step ? 'gradient-primary text-white' :
              s < step ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
              'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
            }`}>{s}</div>
            {s < 2 && <div className={`h-0.5 flex-1 transition-all ${step > s ? 'bg-green-500' : 'bg-[hsl(var(--border))]'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? 'Xác minh email' : 'Đặt mật khẩu mới'}</CardTitle>
          <CardDescription>
            {step === 1 ? 'Nhập email để nhận mã OTP xác minh' : `Nhập OTP từ email ${pendingEmail}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input placeholder="email@example.com" className="pl-10" {...form1.register('email')} />
                </div>
                {form1.formState.errors.email && (
                  <p className="text-xs text-[hsl(var(--destructive))]">{form1.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={form1.formState.isSubmitting}>
                Gửi mã OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-center block">Nhập mã OTP (6 chữ số)</Label>
                <OtpInput value={otp} onChange={(v) => { setOtp(v); form2.setValue('otp', v) }} />
                {form2.formState.errors.otp && (
                  <p className="text-xs text-[hsl(var(--destructive))] text-center">{form2.formState.errors.otp.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...form2.register('newPassword')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form2.formState.errors.newPassword && (
                  <p className="text-xs text-[hsl(var(--destructive))]">{form2.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10"
                    {...form2.register('confirmPassword')}
                  />
                </div>
                {form2.formState.errors.confirmPassword && (
                  <p className="text-xs text-[hsl(var(--destructive))]">{form2.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" loading={form2.formState.isSubmitting}>
                Đổi mật khẩu
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangePasswordPage
