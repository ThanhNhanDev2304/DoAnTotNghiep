import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Megaphone, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { announcementApi, AnnouncementTypeLabel, type AnnouncementType, type Announcement } from '@/api/announcement'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const TYPES: AnnouncementType[] = ['GENERAL', 'RECRUITMENT', 'BONUS', 'REGULATION', 'HOLIDAY', 'URGENT']
const EMPTY = { title: '', content: '', type: 'GENERAL' as AnnouncementType, isPinned: false }

const HrAnnouncementsPage: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['hr-announcements'], queryFn: () => announcementApi.getAll() })
  const announcements: Announcement[] = (data?.data as any)?.data ?? data?.data ?? []

  const createMut = useMutation({
    mutationFn: announcementApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-announcements'] }); setOpen(false); toast.success('Đăng thông báo thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Đăng thất bại')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => announcementApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-announcements'] }); setOpen(false); toast.success('Cập nhật thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })
  const deleteMut = useMutation({
    mutationFn: announcementApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-announcements'] }); setDeleteTarget(null); toast.success('Đã xóa thông báo') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Xóa thất bại')),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, content: a.content, type: a.type, isPinned: a.isPinned }); setOpen(true) }
  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (form.title.trim().length < 3) { toast.error('Tiêu đề tối thiểu 3 ký tự'); return }
    if (!form.content.trim()) { toast.error('Vui lòng nhập nội dung'); return }
    if (form.content.trim().length < 10) { toast.error('Nội dung tối thiểu 10 ký tự'); return }
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Thông báo</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Đăng và quản lý thông báo nội bộ</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Đăng thông báo</Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
        : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{AnnouncementTypeLabel[a.type]}</Badge>
                        {a.isPinned && <Badge variant="outline" className="text-xs gap-1"><Pin className="h-2.5 w-2.5" /> Ghim</Badge>}
                      </div>
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Confirm Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Xác nhận xóa thông báo</DialogTitle></DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-2">
            Bạn có chắc muốn xóa thông báo <span className="font-medium text-[hsl(var(--foreground))]">"{deleteTarget?.title}"</span>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              {deleteMut.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa thông báo' : 'Đăng thông báo mới'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input placeholder="Tiêu đề thông báo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Loại thông báo</Label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.type === t ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>
                    {AnnouncementTypeLabel[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung *</Label>
              <textarea className="w-full min-h-32 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Nội dung thông báo..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
              <label htmlFor="isPinned" className="text-sm flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" /> Ghim thông báo</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'Cập nhật' : 'Đăng thông báo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HrAnnouncementsPage
