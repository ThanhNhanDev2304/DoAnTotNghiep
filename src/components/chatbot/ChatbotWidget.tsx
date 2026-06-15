import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatbotApi, type ChatMessage } from '@/api/chatbot'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Xin chào! Tôi là **UMC AI** — trợ lý HR của bạn. Tôi có thể giúp bạn tìm hiểu về thông báo nội bộ, chính sách, quy định hoặc các câu hỏi nhân sự khác. Bạn cần hỗ trợ gì?',
}

function renderContent(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const history = messages.filter((m) => m !== WELCOME)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatbotApi.chat(text, history)
      const reply = res.data?.data?.reply ?? res.data?.reply ?? ''
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Không thể kết nối AI'))
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => setMessages([WELCOME])

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="gradient-hero px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">UMC AI Assistant</p>
              <p className="text-white/70 text-[11px]">Trợ lý HR thông minh</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="text-white/70 hover:text-white text-[11px] px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
                title="Cuộc trò chuyện mới"
              >
                Mới
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[hsl(var(--primary))] text-white rounded-tr-sm'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] rounded-tl-sm'
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-[hsl(var(--secondary))] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[hsl(var(--border))] shrink-0">
            <div className="flex items-center gap-2 bg-[hsl(var(--secondary))] rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="h-7 w-7 rounded-lg bg-[hsl(var(--primary))] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center mt-1.5">
              AI có thể mắc lỗi — hãy xác minh thông tin quan trọng với HR
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-13 w-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer',
          open
            ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rotate-90'
            : 'gradient-hero text-white hover:scale-110 hover:shadow-xl'
        )}
        title={open ? 'Đóng chat' : 'Chat với AI HR'}
        aria-label="AI Chatbot"
        style={{ height: '52px', width: '52px' }}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}

export default ChatbotWidget
