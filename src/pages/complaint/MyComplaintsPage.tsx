import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { complaintApi, ComplaintTypeLabel, ComplaintStatusLabel, type Complaint, type ComplaintStatus } from '@/api/complaint'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<ComplaintStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning', IN_PROGRESS: 'default', RESOLVED: 'success', REJECTED: 'destructive',
}

const MyComplaintsPage: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['my-complaints'], queryFn: complaintApi.getMy })
  const complaints: Complaint[] = (data?.data as any)?.data ?? data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khiếu nại của tôi</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Theo dõi tiến độ xử lý khiếu nại</p>
        </div>
        <Button asChild className="gap-2"><Link to="/complaints/submit"><Plus className="h-4 w-4" /> Gửi khiếu nại</Link></Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : complaints.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Chưa có khiếu nại nào</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{ComplaintTypeLabel[c.type]}</Badge>
                      </div>
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{c.content}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                      {c.hrNote && <p className="text-xs mt-2 p-2 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">HR: {c.hrNote}</p>}
                    </div>
                    <Badge variant={statusVariant[c.status]} className="shrink-0">{ComplaintStatusLabel[c.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

export default MyComplaintsPage
