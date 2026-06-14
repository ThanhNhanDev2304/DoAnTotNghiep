import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore, type UserProfile } from '@/store/authStore'
import { ensureDeviceIdCookie } from '@/lib/deviceCookie'
import { normalizeUserProfile } from '@/lib/userProfile'

interface GoogleCallbackData {
  accessToken?: string
  user?: UserProfile
}

const decodeGoogleCallbackData = (encodedData: string): GoogleCallbackData | null => {
  try {
    const base64 = decodeURIComponent(encodedData)
    const json = atob(base64)
    return JSON.parse(json) as GoogleCallbackData
  } catch {
    return null
  }
}

const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    ensureDeviceIdCookie()

    const dataParam = searchParams.get('data')
    if (!dataParam) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.')
      navigate('/login', { replace: true })
      return
    }

    const callbackData = decodeGoogleCallbackData(dataParam)
    if (!callbackData?.accessToken || !callbackData.user) {
      toast.error('Dữ liệu đăng nhập Google không hợp lệ.')
      navigate('/login', { replace: true })
      return
    }

    login(normalizeUserProfile(callbackData.user), callbackData.accessToken)
    toast.success(`Chào mừng trở lại, ${callbackData.user.userName}!`)
    navigate('/dashboard', { replace: true })
  }, [login, navigate, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  )
}

export default GoogleCallbackPage
