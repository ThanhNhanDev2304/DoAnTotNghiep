import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Megaphone, Pin, ChevronRight } from 'lucide-react'
import { announcementApi, AnnouncementTypeLabel, type Announcement, type AnnouncementType } from '@/api/announcement'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TYPE_COLORS: Record<AnnouncementType, string> = {
  GENERAL: 'bg-blue-500/10 text-blue-400',
  RECRUITMENT: 'bg-green-500/10 text-green-400',
  BONUS: 'bg-yellow-500/10 text-yellow-400',
  REGULATION: 'bg-purple-500/10 text-purple-400',
  HOLIDAY: 'bg-orange-500/10 text-orange-400',
  URGENT: 'bg-red-500/10 text-red-400',
}

const AnnouncementsPage: React.FC = () => {
  const [filter, setFilter] = useState<AnnouncementType | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', filter],
    queryFn: () => announcementApi.getAll(filter || undefined),
  })
  const announcements: Announcement[] = (data?.data as any)?.data ?? data?.data ?? []

  const TYPES: { value: AnnouncementType | ''; label: string }[] = [
    { value: '', label: 'Tất cả' },
    ...Object.entries(AnnouncementTypeLabel).map(([v, l]) => ({ value: v as AnnouncementType, label: l })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thông báo nội bộ</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Thông tin từ phòng Nhân sự và Ban lãnh đạo</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === t.value ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
          <Megaphone className="h-10 w-10 mb-3 opacity-40" />
          <p>Chưa có thông báo nào</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Link key={a.id} to={`/announcements/${a.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[a.type]}`}>
                      {a.isPinned ? <Pin className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.type]}`}>
                          {AnnouncementTypeLabel[a.type]}
                        </span>
                        {a.isPinned && <Badge variant="outline" className="text-xs gap-1"><Pin className="h-2.5 w-2.5" /> Ghim</Badge>}
                      </div>
                      <p className="font-medium truncate">{a.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {a.author?.fullName ?? a.author?.userName} • {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnnouncementsPage
