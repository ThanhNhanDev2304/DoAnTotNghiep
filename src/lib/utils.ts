import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AxiosError } from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
