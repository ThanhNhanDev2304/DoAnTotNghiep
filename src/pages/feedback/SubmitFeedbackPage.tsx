import React, { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Paperclip, X, Eye, EyeOff, Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { feedbackApi, FeedbackType, FeedbackTypeLabel } from '@/api/feedback'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const FEEDBACK_TYPES: FeedbackType[] = ['SALARY', 'OVERTIME', 'ENVIRONMENT', 'EQUIPMENT', 'MANAGEMENT', 'COLLEAGUE', 'BENEFIT', 'TRAINING', 'OTHER']

const SubmitFeedbackPage: React.FC = () => {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    type: '' as FeedbackType | '',
    title: '',
    content: '',
    isAnonymous: false,
  })
  const [files, setFiles] = useState<File[]>([])

  const mutation = useMutation({
    mutationFn: () => feedbackApi.submit({ ...form, type: form.type as FeedbackType, attachments: files }),
    onSuccess: () => {
      toast.success('Gửi phản hồi thành công!')
      navigate('/feedback/my')
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gửi thất bại')),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024) // max 10MB each
    if (valid.length < selected.length) toast.warning('Một số file vượt quá 10MB và bị loại bỏ')
    setFiles((prev) => [...prev, ...valid].slice(0, 5))
    e.target.value = ''
  }

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = () => {
    if (!form.type) { toast.error('Vui lòng chọn loại phản hồi'); return }
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    if (!form.content.trim() || form.content.length < 10) { toast.error('Nội dung phải ít nhất 10 ký tự'); return }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gửi phản hồi</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Ý kiến của bạn giúp UMC Electronics cải thiện môi trường làm việc</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Thông tin phản hồi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Loại phản hồi */}
          <div className="space-y-2">
            <Label>Loại phản hồi *</Label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.type === t
                      ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'
                  }`}
                >
                  {FeedbackTypeLabel[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input
              placeholder="Tóm tắt nội dung phản hồi"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-right">{form.title.length}/200</p>
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5">
            <Label>Nội dung *</Label>
            <textarea
              className="w-full min-h-[140px] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
              placeholder="Mô tả chi tiết phản hồi của bạn..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={5000}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-right">{form.content.length}/5000</p>
          </div>

          {/* File đính kèm */}
          <div className="space-y-2">
            <Label>Đính kèm minh chứng (tối đa 5 file)</Label>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--secondary))] text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] transition-colors"
                >
                  <Plus className="h-3 w-3" /> Thêm file
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Hỗ trợ: ảnh, PDF, Word — tối đa 10MB/file</p>
          </div>

          {/* Ẩn danh */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(var(--secondary))]">
            <button
              onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
              className={`mt-0.5 h-4 w-4 rounded border transition-colors flex-shrink-0 ${
                form.isAnonymous ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                {form.isAnonymous ? <EyeOff className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> : <Eye className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                <span className="text-sm font-medium">Gửi ẩn danh</span>
                {form.isAnonymous && <Badge variant="outline" className="text-xs">Đang bật</Badge>}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Khi bật, HR sẽ không biết bạn là ai. Hệ thống vẫn xác minh bạn là nhân viên thật để tránh spam.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending} className="gap-2">
          <Send className="h-4 w-4" />
          {mutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
        </Button>
      </div>
    </div>
  )
}

export default SubmitFeedbackPage
