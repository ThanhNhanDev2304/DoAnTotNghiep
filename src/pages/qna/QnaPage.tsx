import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, Send, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { qnaApi, type QnA } from '@/api/qna'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  { value: 'GENERAL', label: 'Chung' },
  { value: 'POLICY', label: 'Chính sách' },
  { value: 'SALARY', label: 'Lương thưởng' },
  { value: 'INSURANCE', label: 'Bảo hiểm' },
  { value: 'LEAVE', label: 'Nghỉ phép' },
]

const QnaPage: React.FC = () => {
  const qc = useQueryClient()
  const [form, setForm] = useState({ question: '', category: 'GENERAL' })
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['my-qna'], queryFn: qnaApi.getMy })
  const qnas: QnA[] = (data?.data as any)?.data ?? data?.data ?? []

  const mutation = useMutation({
    mutationFn: () => qnaApi.ask(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-qna'] }); setForm({ question: '', category: 'GENERAL' }); toast.success('Đã gửi câu hỏi!') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleAsk = () => {
    if (!form.question.trim() || form.question.length < 10) { toast.error('Câu hỏi phải ít nhất 10 ký tự'); return }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hỏi đáp nội bộ</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Đặt câu hỏi cho phòng Nhân sự, câu hỏi sẽ được trả lời sớm nhất</p>
      </div>

      {/* Form hỏi */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Đặt câu hỏi mới</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setForm({ ...form, category: c.value })}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.category === c.value ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Câu hỏi *</Label>
            <textarea
              className="w-full min-h-24 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Nhập câu hỏi của bạn..."
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              maxLength={500}
            />
          </div>
          <Button onClick={handleAsk} disabled={mutation.isPending} size="sm" className="gap-2">
            <Send className="h-3.5 w-3.5" />{mutation.isPending ? 'Đang gửi...' : 'Gửi câu hỏi'}
          </Button>
        </CardContent>
      </Card>

      {/* Danh sách câu hỏi */}
      {isLoading ? <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : qnas.length === 0 ? <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-6">Chưa có câu hỏi nào</p>
        : (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Câu hỏi của tôi</h2>
            {qnas.map((q) => (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.status === 'ANSWERED'
                        ? <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Đã trả lời</Badge>
                        : <Badge variant="warning">Chờ trả lời</Badge>}
                      {expanded === q.id ? <ChevronUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                    </div>
                  </div>
                  {expanded === q.id && q.answers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] space-y-2">
                      {q.answers.map((a) => (
                        <div key={a.id} className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
                          <p className="text-xs font-medium text-[hsl(var(--primary))] mb-1">HR — {a.author?.fullName ?? a.author?.userName}</p>
                          <p className="text-sm">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

export default QnaPage
