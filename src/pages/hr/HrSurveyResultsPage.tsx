import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, BarChart3, Star, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { surveyApi } from '@/api/survey'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Respondent {
  employeeCode: string | null
  userName: string
  fullName: string | null
  submittedAt: string
}

interface AnswerDetail {
  answer: string
  employeeCode: string | null
  userName: string
  fullName: string | null
  submittedAt: string
}

interface QuestionResult {
  questionId: string
  question: string
  type: string
  totalAnswers: number
  average: number | null
  distribution: Record<string, number>
  details: AnswerDetail[]
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  RATING: 'Đánh giá',
  TEXT: 'Văn bản',
  YES_NO: 'Có/Không',
  SINGLE_CHOICE: 'Một lựa chọn',
  MULTI_CHOICE: 'Nhiều lựa chọn',
}

// ─── Tab: Tổng hợp ────────────────────────────────────────────────────────────

const AggregateTab: React.FC<{ results: QuestionResult[] }> = ({ results }) => {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (results.length === 0)
    return (
      <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Chưa có dữ liệu</p>
      </div>
    )

  return (
    <div className="space-y-4">
      {results.map((r, i) => (
        <Card key={r.questionId}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <CardTitle className="text-sm font-medium flex-1">{r.question}</CardTitle>
              <Badge variant="outline" className="text-xs">{QUESTION_TYPE_LABEL[r.type] ?? r.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.totalAnswers} câu trả lời</p>

            {r.average !== null && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">{r.average}</span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">/ 5 điểm trung bình</span>
              </div>
            )}

            {Object.keys(r.distribution).length > 0 && (
              <div className="space-y-2">
                {Object.entries(r.distribution).map(([key, count]) => {
                  const pct = Math.round(((count as number) / (r.totalAnswers || 1)) * 100)
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs w-24 text-right shrink-0 text-[hsl(var(--muted-foreground))] truncate">{key}</span>
                      <div className="flex-1 h-5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                        <div className="h-full bg-[hsl(var(--primary))] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs w-16 text-[hsl(var(--muted-foreground))] shrink-0">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Chi tiết câu trả lời từng người */}
            {r.details.length > 0 && (
              <div>
                <button
                  onClick={() => setExpanded(expanded === r.questionId ? null : r.questionId)}
                  className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline mt-1"
                >
                  {expanded === r.questionId ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Chi tiết từng người
                </button>
                {expanded === r.questionId && (
                  <div className="mt-2 rounded-lg border border-[hsl(var(--border))] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
                          <th className="px-3 py-2 text-left font-medium text-[hsl(var(--muted-foreground))]">Mã NV</th>
                          <th className="px-3 py-2 text-left font-medium text-[hsl(var(--muted-foreground))]">Tài khoản</th>
                          <th className="px-3 py-2 text-left font-medium text-[hsl(var(--muted-foreground))]">Họ tên</th>
                          <th className="px-3 py-2 text-left font-medium text-[hsl(var(--muted-foreground))]">Câu trả lời</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.details.map((d, idx) => (
                          <tr key={idx} className="border-b border-[hsl(var(--border))/0.5] last:border-0 hover:bg-[hsl(var(--secondary)/0.5)]">
                            <td className="px-3 py-2 font-mono text-[hsl(var(--muted-foreground))]">{d.employeeCode ?? '—'}</td>
                            <td className="px-3 py-2">{d.userName}</td>
                            <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{d.fullName ?? '—'}</td>
                            <td className="px-3 py-2 font-medium">{d.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Tab: Chi tiết người tham gia ─────────────────────────────────────────────

const RespondentsTab: React.FC<{ respondents: Respondent[]; results: QuestionResult[] }> = ({ respondents, results }) => {
  if (respondents.length === 0)
    return (
      <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Chưa có ai tham gia</p>
      </div>
    )

  // Build per-user answer map: userName → { questionId → answer }
  const answerMap: Record<string, Record<string, string>> = {}
  results.forEach((q) => {
    q.details.forEach((d) => {
      if (!answerMap[d.userName]) answerMap[d.userName] = {}
      answerMap[d.userName][q.questionId] = d.answer
    })
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{respondents.length} người đã tham gia</p>
      <div className="rounded-lg border border-[hsl(var(--border))] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
              <th className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">#</th>
              <th className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Mã NV</th>
              <th className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Tài khoản</th>
              <th className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Họ tên</th>
              {results.map((q, i) => (
                <th key={q.questionId} className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap max-w-32">
                  <span className="truncate block">Câu {i + 1}</span>
                  <span className="font-normal text-[10px] text-[hsl(var(--muted-foreground)/0.7)] truncate block max-w-28">{q.question.slice(0, 30)}{q.question.length > 30 ? '…' : ''}</span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {respondents.map((r, idx) => (
              <tr key={idx} className="border-b border-[hsl(var(--border))/0.5] last:border-0 hover:bg-[hsl(var(--secondary)/0.5)]">
                <td className="px-3 py-2.5 text-[hsl(var(--muted-foreground))]">{idx + 1}</td>
                <td className="px-3 py-2.5 font-mono text-[hsl(var(--primary))] font-medium whitespace-nowrap">{r.employeeCode ?? '—'}</td>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">{r.userName}</td>
                <td className="px-3 py-2.5 text-[hsl(var(--muted-foreground))] whitespace-nowrap">{r.fullName ?? '—'}</td>
                {results.map((q) => (
                  <td key={q.questionId} className="px-3 py-2.5 max-w-32">
                    <span className="block truncate">{answerMap[r.userName]?.[q.questionId] ?? '—'}</span>
                  </td>
                ))}
                <td className="px-3 py-2.5 text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {new Date(r.submittedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const HrSurveyResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'aggregate' | 'respondents'>('aggregate')

  const { data, isLoading } = useQuery({
    queryKey: ['survey-results', id],
    queryFn: () => surveyApi.getResults(id!),
    enabled: !!id,
  })
  const raw = (data?.data as any)?.data ?? data?.data
  const survey = raw?.survey
  const results: QuestionResult[] = raw?.results ?? []
  const respondents: Respondent[] = raw?.respondents ?? []

  if (isLoading) return <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải kết quả...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/hr/surveys')}
          className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{survey?.title ?? 'Kết quả khảo sát'}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{survey?.totalResponses ?? 0} lượt tham gia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[hsl(var(--border))]">
        {[
          { key: 'aggregate', label: 'Tổng hợp', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { key: 'respondents', label: `Chi tiết (${respondents.length})`, icon: <Users className="h-3.5 w-3.5" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'aggregate' ? (
        <AggregateTab results={results} />
      ) : (
        <RespondentsTab respondents={respondents} results={results} />
      )}
    </div>
  )
}

export default HrSurveyResultsPage
