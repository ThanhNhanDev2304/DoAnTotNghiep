import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { qnaApi, type QnA } from '@/api/qna'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const HrQnaPage: React.FC = () => {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({ queryKey: ['hr-qna'], queryFn: () => qnaApi.getAll() })
  const qnas: QnA[] = (data?.data as any)?.data ?? data?.data ?? []

  const answerMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => qnaApi.answer(id, content),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['hr-qna'] }); setAnswers((prev) => ({ ...prev, [vars.id]: '' })); toast.success('Đã gửi câu trả lời') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hỏi đáp HR</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Trả lời câu hỏi từ nhân viên</p>
      </div>

      <div className="flex gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <span>Tổng: <strong>{qnas.length}</strong></span>
        <span>• Chờ: <strong className="text-yellow-400">{qnas.filter(q => q.status === 'PENDING').length}</strong></span>
        <span>• Đã trả lời: <strong className="text-green-400">{qnas.filter(q => q.status === 'ANSWERED').length}</strong></span>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : qnas.length === 0 ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]"><HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Không có câu hỏi nào</p></div>
        : (
          <div className="space-y-3">
            {qnas.map((q) => (
              <Card key={q.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>{q.user?.fullName ?? q.user?.userName}</span>
                        {q.user?.employeeCode && <span>({q.user.employeeCode})</span>}
                        <span>•</span><span>{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm font-medium">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={q.status === 'ANSWERED' ? 'success' : 'warning'}>
                        {q.status === 'ANSWERED' ? 'Đã trả lời' : 'Chờ trả lời'}
                      </Badge>
                      {expanded === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {expanded === q.id && (
                    <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] space-y-3">
                      {q.answers.map((a) => (
                        <div key={a.id} className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
                          <p className="text-xs font-medium text-[hsl(var(--primary))] mb-1">{a.author?.fullName ?? a.author?.userName} (HR)</p>
                          <p className="text-sm">{a.content}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <textarea
                          className="flex-1 min-h-16 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                          placeholder="Nhập câu trả lời..."
                          value={answers[q.id] ?? ''}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        />
                        <Button size="sm" className="gap-1.5 self-end"
                          onClick={() => answerMut.mutate({ id: q.id, content: answers[q.id] ?? '' })}
                          disabled={!answers[q.id]?.trim() || answerMut.isPending}>
                          <Send className="h-3.5 w-3.5" /> Gửi
                        </Button>
                      </div>
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

export default HrQnaPage
