import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { feedbackApi, FeedbackTypeLabel, FeedbackStatusLabel, type Feedback, type FeedbackStatus } from '@/api/feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<FeedbackStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  REVIEWING: 'default',
  RESOLVED: 'success',
  REJECTED: 'destructive',
}

const StatusIcon = ({ status }: { status: FeedbackStatus }) => {
  if (status === 'RESOLVED') return <CheckCircle className="h-4 w-4 text-green-400" />
  if (status === 'REJECTED') return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-yellow-400" />
}

const MyFeedbacksPage: React.FC = () => {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-feedbacks', page],
    queryFn: () => feedbackApi.getMy({ page, limit: 10 }),
  })

  const result = (data?.data as any)?.data ?? data?.data
  const feedbacks: Feedback[] = result?.items ?? []
  const total: number = result?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phản hồi của tôi</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Theo dõi trạng thái các phản hồi đã gửi</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/feedback/submit"><Plus className="h-4 w-4" /> Gửi phản hồi mới</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Chưa có phản hồi nào</p>
            <p className="text-sm mt-1">Hãy gửi phản hồi đầu tiên của bạn</p>
            <Button asChild className="mt-4" size="sm"><Link to="/feedback/submit">Gửi phản hồi</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{FeedbackTypeLabel[f.type]}</Badge>
                      {f.isAnonymous && <Badge variant="outline" className="text-xs text-[hsl(var(--muted-foreground))]">Ẩn danh</Badge>}
                    </div>
                    <p className="font-medium text-[hsl(var(--foreground))] truncate">{f.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{f.content}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      {new Date(f.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={f.status} />
                      <Badge variant={statusVariant[f.status]}>{FeedbackStatusLabel[f.status]}</Badge>
                    </div>
                    {f.hrNote && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-40 text-right">
                        HR: {f.hrNote}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {total > 10 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <span className="flex items-center text-sm px-3">{page} / {Math.ceil(total / 10)}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyFeedbacksPage
