import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { complaintApi, ComplaintTypeLabel, type ComplaintType } from '@/api/complaint'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TYPES: ComplaintType[] = ['SALARY', 'TIMEKEEPING', 'INSURANCE', 'DISCIPLINE', 'OTHER']

const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '', type: '' as ComplaintType | '' })

  const mutation = useMutation({
    mutationFn: () => complaintApi.submit({ ...form, type: form.type as ComplaintType }),
    onSuccess: () => { toast.success('Gửi khiếu nại thành công!'); navigate('/complaints') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleSubmit = () => {
    if (!form.type) { toast.error('Vui lòng chọn loại khiếu nại'); return }
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (!form.content.trim() || form.content.length < 10) { toast.error('Nội dung phải ít nhất 10 ký tự'); return }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gửi khiếu nại</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Khiếu nại sẽ được HR xem xét và phản hồi trong thời gian sớm nhất</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin khiếu nại</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Loại khiếu nại *</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.type === t ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'}`}>
                  {ComplaintTypeLabel[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input placeholder="Tóm tắt khiếu nại" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>Nội dung chi tiết *</Label>
            <textarea
              className="w-full min-h-36 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="Mô tả chi tiết nội dung khiếu nại..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={5000}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
          <Send className="h-4 w-4" />{mutation.isPending ? 'Đang gửi...' : 'Gửi khiếu nại'}
        </Button>
      </div>
    </div>
  )
}

export default SubmitComplaintPage
