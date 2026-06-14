import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle, Clock } from 'lucide-react'
import { surveyApi, type Survey } from '@/api/survey'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const SurveysPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['active-surveys'],
    queryFn: surveyApi.getActive,
  })
  const surveys: Survey[] = (data?.data as any)?.data ?? data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Khảo sát</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Các khảo sát đang mở từ phòng Nhân sự</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Không có khảo sát nào đang mở</p>
            <p className="text-sm mt-1">HR sẽ thông báo khi có khảo sát mới</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveys.map((s) => (
            <Card key={s.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
                  {s.hasResponded ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <CheckCircle className="h-3 w-3" /> Đã điền
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="shrink-0 gap-1">
                      <Clock className="h-3 w-3" /> Chưa điền
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{s.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{s._count?.questions ?? 0} câu hỏi</span>
                  <span>•</span>
                  <span>{s._count?.responses ?? 0} lượt trả lời</span>
                  {s.endDate && (
                    <>
                      <span>•</span>
                      <span>HSD: {new Date(s.endDate).toLocaleDateString('vi-VN')}</span>
                    </>
                  )}
                </div>
                {s.hasResponded ? (
                  <Button size="sm" className="w-full" variant="outline" disabled>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" /> Đã khảo sát
                  </Button>
                ) : (
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/surveys/${s.id}/fill`}>Điền khảo sát</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SurveysPage
