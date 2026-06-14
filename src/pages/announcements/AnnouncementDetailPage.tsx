import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Megaphone } from 'lucide-react'
import { announcementApi, AnnouncementTypeLabel } from '@/api/announcement'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementApi.getOne(id!),
    enabled: !!id,
  })
  const ann = (data?.data as any)?.data ?? data?.data

  if (isLoading) return <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
  if (!ann) return <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Không tìm thấy thông báo</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/announcements')} className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
        <ChevronLeft className="h-4 w-4" /> Quay lại
      </button>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{AnnouncementTypeLabel[ann.type]}</Badge>
            {ann.isPinned && <Badge variant="outline">Ghim</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{ann.title}</h1>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Megaphone className="h-4 w-4" />
            <span>{ann.author?.fullName ?? ann.author?.userName}</span>
            <span>•</span>
            <span>{new Date(ann.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
          <div className="border-t border-[hsl(var(--border))] pt-4 prose prose-sm max-w-none text-[hsl(var(--foreground))]">
            {ann.content.split('\n').map((line: string, i: number) => (
              <p key={i} className="mb-2 last:mb-0">{line || <br />}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnnouncementDetailPage
