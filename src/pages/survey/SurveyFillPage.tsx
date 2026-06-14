import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { surveyApi, type SurveyQuestion } from '@/api/survey'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const RatingInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        onClick={() => onChange(String(n))}
        className={`h-9 w-9 rounded-full border text-sm font-bold transition-all ${
          value === String(n)
            ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
            : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'
        }`}
      >
        {n}
      </button>
    ))}
    <span className="flex items-center text-xs text-[hsl(var(--muted-foreground))] ml-2">
      {value ? `${value}/5` : 'Chưa chọn'}
    </span>
  </div>
)

const QuestionCard: React.FC<{
  question: SurveyQuestion
  index: number
  value: string
  onChange: (v: string) => void
}> = ({ question, index, value, onChange }) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start gap-2">
        <span className="shrink-0 h-6 w-6 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <CardTitle className="text-sm font-medium leading-normal">
          {question.question}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      {question.type === 'RATING' && <RatingInput value={value} onChange={onChange} />}

      {question.type === 'TEXT' && (
        <textarea
          className="w-full min-h-24 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          placeholder="Nhập câu trả lời..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === 'YES_NO' && (
        <div className="flex gap-3">
          {['Có', 'Không'].map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-6 py-2 rounded-lg border text-sm font-medium transition-all ${
                value === opt
                  ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                  : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE') && (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const isSelected = question.type === 'MULTI_CHOICE'
              ? value.split('|').includes(opt)
              : value === opt
            return (
              <button
                key={opt}
                onClick={() => {
                  if (question.type === 'MULTI_CHOICE') {
                    const parts = value ? value.split('|').filter(Boolean) : []
                    const next = isSelected ? parts.filter((p) => p !== opt) : [...parts, opt]
                    onChange(next.join('|'))
                  } else {
                    onChange(opt)
                  }
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? 'bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
)

const SurveyFillPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveyApi.getOne(id!),
    enabled: !!id,
  })
  const survey = (data?.data as any)?.data ?? data?.data

  const mutation = useMutation({
    mutationFn: () => {
      const formatted = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
      return surveyApi.submit(id!, formatted)
    },
    onSuccess: () => { toast.success('Điền khảo sát thành công!'); navigate('/surveys') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleSubmit = () => {
    const required = (survey?.questions ?? []).filter((q: SurveyQuestion) => q.required)
    const missing = required.filter((q: SurveyQuestion) => !answers[q.id]?.trim())
    if (missing.length > 0) { toast.error(`Vui lòng trả lời ${missing.length} câu hỏi bắt buộc`); return }
    mutation.mutate()
  }

  if (isLoading) return <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
  if (!survey) return <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Không tìm thấy khảo sát</div>
  if (survey.status !== 'ACTIVE') return (
    <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
      <p className="font-medium">Khảo sát này chưa mở hoặc đã đóng.</p>
      <button onClick={() => navigate('/surveys')} className="mt-3 text-sm underline">Quay lại danh sách</button>
    </div>
  )

  const questions: SurveyQuestion[] = survey.questions ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/surveys')} className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
        <ChevronLeft className="h-4 w-4" /> Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        {survey.description && <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{survey.description}</p>}
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{questions.length} câu hỏi</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            value={answers[q.id] ?? ''}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate('/surveys')}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
          <Send className="h-4 w-4" />
          {mutation.isPending ? 'Đang gửi...' : 'Nộp khảo sát'}
        </Button>
      </div>
    </div>
  )
}

export default SurveyFillPage
