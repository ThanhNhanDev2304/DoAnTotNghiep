import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Heart, AlertCircle } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { departmentsApi } from '@/api/departments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const now = new Date()

const HealthBar: React.FC<{ score: number; name: string }> = ({ score, name }) => {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className={`font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-3 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

const HrReportsPage: React.FC = () => {
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: overviewData } = useQuery({ queryKey: ['dashboard-overview'], queryFn: dashboardApi.getOverview })
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health-scores', month, year],
    queryFn: () => dashboardApi.getHealthScores(month, year),
  })
  const { data: trendData } = useQuery({ queryKey: ['feedback-trend'], queryFn: dashboardApi.getFeedbackTrend })
  const { data: typeData } = useQuery({ queryKey: ['feedback-by-type'], queryFn: dashboardApi.getFeedbackByType })

  const overview = (overviewData?.data as any)?.data ?? overviewData?.data
  const healthScores = (healthData?.data as any)?.data ?? healthData?.data
  const trend = (trendData?.data as any)?.data ?? trendData?.data ?? []
  const byType = (typeData?.data as any)?.data ?? typeData?.data ?? []

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))
  const YEARS = [2024, 2025, 2026]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Báo cáo & Phân tích</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Tổng hợp dữ liệu phản hồi người lao động</p>
      </div>

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tổng nhân viên', value: overview.stats?.totalEmployees, icon: '👥' },
            { label: 'Tổng phản hồi', value: overview.stats?.totalFeedbacks, icon: '💬' },
            { label: 'Kiến nghị', value: overview.stats?.totalProposals, icon: '⭐' },
            { label: 'Khiếu nại', value: overview.stats?.totalComplaints, icon: '⚠️' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold">{s.value ?? 0}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Department Health Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 text-red-400" /> Chỉ số sức khỏe phòng ban
            </CardTitle>
            <div className="flex gap-2">
              <select className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-xs"
                value={month} onChange={(e) => setMonth(+e.target.value)}>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-xs"
                value={year} onChange={(e) => setYear(+e.target.value)}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {healthLoading ? <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">Đang tính...</p>
            : (healthScores?.departments?.length ?? 0) === 0 ? (
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-4">
                Chưa đủ dữ liệu cho tháng {month}/{year}
              </p>
            ) : (
              <div className="space-y-4">
                {healthScores?.departments?.map((d: any) => (
                  <div key={d.departmentId} className="space-y-2">
                    <HealthBar score={d.healthScore} name={d.departmentName} />
                    <div className="grid grid-cols-3 gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>Phản hồi: {d.breakdown?.feedbackScore}/100</span>
                      <span>Đánh giá: {d.breakdown?.evalScore}/100</span>
                      <span>Khiếu nại: {d.breakdown?.complaintScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Feedback Trend */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-400" /> Xu hướng phản hồi 6 tháng gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trend.map((t: any) => {
                const max = Math.max(...trend.map((x: any) => x.total), 1)
                return (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="text-xs w-16 shrink-0 text-[hsl(var(--muted-foreground))]">{t.label}</span>
                    <div className="flex-1 h-6 rounded bg-[hsl(var(--secondary))] overflow-hidden flex">
                      <div className="h-full bg-green-500/60" style={{ width: `${(t.positive / max) * 100}%` }} title={`Tích cực: ${t.positive}`} />
                      <div className="h-full bg-gray-400/60" style={{ width: `${(t.neutral / max) * 100}%` }} title={`Trung lập: ${t.neutral}`} />
                      <div className="h-full bg-red-500/60" style={{ width: `${(t.negative / max) * 100}%` }} title={`Tiêu cực: ${t.negative}`} />
                    </div>
                    <span className="text-xs w-8 text-right text-[hsl(var(--muted-foreground))]">{t.total}</span>
                  </div>
                )
              })}
              <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))] pt-1">
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500/60 inline-block" /> Tích cực</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-gray-400/60 inline-block" /> Trung lập</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-500/60 inline-block" /> Tiêu cực</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Type */}
      {byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-orange-400" /> Phân bổ theo loại phản hồi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byType.map((t: any) => {
                const total = byType.reduce((s: number, x: any) => s + x._count.id, 0) || 1
                const pct = Math.round((t._count.id / total) * 100)
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0 text-[hsl(var(--muted-foreground))]">{t.type}</span>
                    <div className="flex-1 h-4 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
                      <div className="h-full bg-[hsl(var(--primary))] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs w-12 text-right text-[hsl(var(--muted-foreground))]">{t._count.id} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default HrReportsPage
