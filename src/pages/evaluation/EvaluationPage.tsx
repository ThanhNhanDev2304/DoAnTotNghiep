import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Star } from 'lucide-react'
import { toast } from 'sonner'
import { evaluationApi, type CreateEvaluationDto, type WorkplaceEvaluation } from '@/api/evaluation'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const now = new Date()

interface ScoreField {
  key: keyof CreateEvaluationDto
  label: string
}

const SCORE_FIELDS: ScoreField[] = [
  { key: 'salaryScore', label: 'Lương thưởng' },
  { key: 'managementScore', label: 'Quản lý' },
  { key: 'colleagueScore', label: 'Đồng nghiệp' },
  { key: 'environmentScore', label: 'Môi trường làm việc' },
  { key: 'benefitScore', label: 'Phúc lợi' },
  { key: 'trainingScore', label: 'Đào tạo' },
]

const StarRating: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} onClick={() => onChange(n)} className="p-0.5">
        <Star className={`h-6 w-6 transition-colors ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-[hsl(var(--border))] hover:text-yellow-300'}`} />
      </button>
    ))}
    {value > 0 && <span className="flex items-center text-sm ml-2 text-[hsl(var(--muted-foreground))]">{value}/5</span>}
  </div>
)

const EvaluationPage: React.FC = () => {
  const qc = useQueryClient()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')

  const { data: myData } = useQuery({ queryKey: ['my-evaluations'], queryFn: evaluationApi.getMy })
  const myEvaluations: WorkplaceEvaluation[] = (myData?.data as any)?.data ?? myData?.data ?? []

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const alreadyEvaluated = myEvaluations.some((e) => e.month === currentMonth && e.year === currentYear)

  const mutation = useMutation({
    mutationFn: () => evaluationApi.submit({
      month: currentMonth,
      year: currentYear,
      salaryScore: scores.salaryScore ?? 0,
      managementScore: scores.managementScore ?? 0,
      colleagueScore: scores.colleagueScore ?? 0,
      environmentScore: scores.environmentScore ?? 0,
      benefitScore: scores.benefitScore ?? 0,
      trainingScore: scores.trainingScore ?? 0,
      comment: comment || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-evaluations'] }); toast.success('Đánh giá tháng này thành công!') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleSubmit = () => {
    const missing = SCORE_FIELDS.filter((f) => !scores[f.key])
    if (missing.length > 0) { toast.error(`Vui lòng đánh giá: ${missing.map(f => f.label).join(', ')}`); return }
    mutation.mutate()
  }

  const avgScore = SCORE_FIELDS.length > 0
    ? SCORE_FIELDS.reduce((s, f) => s + (scores[f.key] ?? 0), 0) / SCORE_FIELDS.length
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá môi trường làm việc</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Đánh giá tháng {currentMonth}/{currentYear}</p>
      </div>

      {alreadyEvaluated ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <BarChart3 className="h-10 w-10 mb-3 text-green-400" />
            <p className="font-medium text-[hsl(var(--foreground))]">Bạn đã đánh giá tháng {currentMonth}/{currentYear}</p>
            <p className="text-sm mt-1">Cảm ơn đóng góp của bạn! Mỗi tháng chỉ đánh giá 1 lần.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Đánh giá theo tiêu chí</span>
              {avgScore > 0 && (
                <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                  Trung bình: <span className="text-yellow-400 font-semibold">{avgScore.toFixed(1)}/5</span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {SCORE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label} *</Label>
                <StarRating
                  value={scores[f.key] ?? 0}
                  onChange={(v) => setScores((prev) => ({ ...prev, [f.key]: v }))}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Nhận xét thêm (tùy chọn)</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                placeholder="Ý kiến khác của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
            </div>
            <Button onClick={handleSubmit} disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lịch sử đánh giá */}
      {myEvaluations.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Lịch sử đánh giá</h2>
          {myEvaluations.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Tháng {e.month}/{e.year}</p>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold">{e.averageScore.toFixed(1)}</span>
                    <span className="text-[hsl(var(--muted-foreground))] text-xs">/5</span>
                  </div>
                </div>
                {e.comment && <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">{e.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EvaluationPage
