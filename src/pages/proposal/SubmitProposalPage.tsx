import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { proposalApi } from '@/api/proposal'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SubmitProposalPage: React.FC = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '' })

  const mutation = useMutation({
    mutationFn: () => proposalApi.submit(form),
    onSuccess: () => { toast.success('Gửi kiến nghị thành công!'); navigate('/proposals') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (!form.content.trim() || form.content.length < 10) { toast.error('Nội dung phải ít nhất 10 ký tự'); return }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gửi kiến nghị & đề xuất</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Đề xuất cải thiện môi trường làm việc tại UMC Electronics</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin kiến nghị</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input placeholder="Tóm tắt kiến nghị của bạn" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>Nội dung chi tiết *</Label>
            <textarea
              className="w-full min-h-36 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Mô tả chi tiết đề xuất của bạn..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={5000}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-right">{form.content.length}/5000</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
          <Send className="h-4 w-4" />{mutation.isPending ? 'Đang gửi...' : 'Gửi kiến nghị'}
        </Button>
      </div>
    </div>
  )
}

export default SubmitProposalPage
