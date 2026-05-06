import React, { useRef } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange, disabled }) => {
  const inputsRef = useRef<HTMLInputElement[]>([])
  const digits = value.padEnd(length, '').split('').slice(0, length)

  const handleChange = (index: number, char: string) => {
    const cleaned = char.replace(/\D/, '')
    if (!cleaned) return
    const arr = digits.map((d) => d)
    arr[index] = cleaned
    onChange(arr.join(''))
    if (index < length - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const arr = digits.map((d) => d)
      arr[index] = ''
      onChange(arr.join(''))
      if (index > 0) inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, ''))
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { if (el) inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn('otp-input', disabled && 'opacity-50 cursor-not-allowed')}
        />
      ))}
    </div>
  )
}

export default OtpInput
