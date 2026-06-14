import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, Plus } from 'lucide-react'
import { proposalApi, ProposalStatusLabel, type Proposal, type ProposalStatus } from '@/api/proposal'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<ProposalStatus, 'default' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning', IN_PROGRESS: 'default', COMPLETED: 'success', REJECTED: 'destructive',
}

const MyProposalsPage: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['my-proposals'], queryFn: proposalApi.getMy })
  const proposals: Proposal[] = (data?.data as any)?.data ?? data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kiến nghị & Đề xuất</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Theo dõi tiến độ xử lý kiến nghị</p>
        </div>
        <Button asChild className="gap-2"><Link to="/proposals/submit"><Plus className="h-4 w-4" /> Gửi kiến nghị</Link></Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : proposals.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <Star className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Chưa có kiến nghị nào</p>
            <Button asChild className="mt-4" size="sm"><Link to="/proposals/submit">Gửi kiến nghị đầu tiên</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{p.content}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                      {p.hrNote && <p className="text-xs mt-2 p-2 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">HR: {p.hrNote}</p>}
                    </div>
                    <Badge variant={statusVariant[p.status]} className="shrink-0">{ProposalStatusLabel[p.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

export default MyProposalsPage
