const DEVICE_ID_COOKIE_NAME = 'deviceId'
const REFRESH_TOKEN_EXPIRE = '7d'

const TIME_UNITS_IN_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
}

const parseMaxAgeSeconds = (value: string): number => {
  const match = value.trim().match(/^(\d+)\s*([smhd])$/i)
  if (!match) {
    return TIME_UNITS_IN_SECONDS.d
  }

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  return amount * TIME_UNITS_IN_SECONDS[unit]
}

const getCookie = (name: string) => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

const createDeviceId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const ensureDeviceIdCookie = () => {
  const existingDeviceId = getCookie(DEVICE_ID_COOKIE_NAME)
  const deviceId = existingDeviceId || createDeviceId()
  const maxAge = parseMaxAgeSeconds(REFRESH_TOKEN_EXPIRE)
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${DEVICE_ID_COOKIE_NAME}=${encodeURIComponent(deviceId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`

  return deviceId
}

