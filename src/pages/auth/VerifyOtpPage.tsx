import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import OtpInput from '@/components/shared/OtpInput'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const RESEND_COOLDOWN = 60

const VerifyOtpPage: React.FC = () => {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const { pendingEmail } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!pendingEmail) navigate('/register')
  }, [pendingEmail, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const handleVerify = async () => {
    if (otp.replace(/\s/g, '').length < 6) {
      toast.error('Vui lòng nhập đầy đủ 6 chữ số OTP')
      return
    }
    setLoading(true)
    try {
      await authApi.verifyRegisterOtp({ email: pendingEmail!, otp: otp.replace(/\s/g, '') })
      toast.success('Xác minh thành công! Tài khoản đã được kích hoạt.')
      navigate('/login')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'OTP không hợp lệ hoặc đã hết hạn.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResending(true)
    try {
      await authApi.resendRegisterOtp({ email: pendingEmail! })
      setCountdown(RESEND_COOLDOWN)
      setOtp('')
      toast.success('Mã OTP mới đã được gửi đến email của bạn.')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Không thể gửi lại OTP.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[hsl(var(--primary)/0.1)] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-4 animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">Xác minh email</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Mã OTP đã được gửi đến
          </p>
          <p className="text-[hsl(var(--primary))] font-medium text-sm mt-0.5">{pendingEmail}</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">Nhập mã OTP</CardTitle>
            <CardDescription>Mã có hiệu lực trong vòng 10 phút</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

            <Button
              onClick={handleVerify}
              className="w-full"
              size="lg"
              loading={loading}
              disabled={otp.replace(/\s/g, '').length < 6}
            >
              Xác minh tài khoản
            </Button>

            <div className="text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                Không nhận được mã?
              </p>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="flex items-center gap-1.5 mx-auto text-sm font-medium text-[hsl(var(--primary))] hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-opacity"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VerifyOtpPage
