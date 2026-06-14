import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, BarChart3, Play, Square, ClipboardList, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { surveyApi, type Survey, type CreateSurveyDto, type UpdateSurveyDto, type QuestionType } from '@/api/survey'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'text-gray-400', ACTIVE: 'text-green-400', CLOSED: 'text-red-400',
}
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Nháp', ACTIVE: 'Đang mở', CLOSED: 'Đã đóng' }
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'RATING', label: '⭐ Đánh giá (1-5)' },
  { value: 'TEXT', label: '💬 Văn bản tự do' },
  { value: 'YES_NO', label: '✅ Có / Không' },
  { value: 'SINGLE_CHOICE', label: '🔘 Một lựa chọn' },
  { value: 'MULTI_CHOICE', label: '☑️ Nhiều lựa chọn' },
]

type FormState = {
  title: string
  description: string
  questions: { question: string; type: QuestionType; options?: string[]; required?: boolean }[]
}

const emptyForm = (): FormState => ({ title: '', description: '', questions: [] })

const SurveyFormDialog: React.FC<{
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  initialData: FormState
  onSubmit: (data: FormState) => void
  isPending: boolean
  submitLabel: string
}> = ({ open, onOpenChange, title, initialData, onSubmit, isPending, submitLabel }) => {
  const [form, setForm] = useState<FormState>(initialData)
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'RATING' as QuestionType, options: '' })

  React.useEffect(() => {
    if (open) {
      setForm(initialData)
      setNewQuestion({ question: '', type: 'RATING', options: '' })
    }
  }, [open, initialData])

  const addQuestion = () => {
    if (!newQuestion.question.trim()) { toast.error('Nhập câu hỏi'); return }
    const options = newQuestion.options.split('\n').map(s => s.trim()).filter(Boolean)
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: newQuestion.question, type: newQuestion.type, options, required: true }],
    }))
    setNewQuestion({ question: '', type: 'RATING', options: '' })
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Nhập tiêu đề khảo sát'); return }
    if (!form.questions.length) { toast.error('Thêm ít nhất 1 câu hỏi'); return }
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Input placeholder="Khảo sát hài lòng tháng 6/2025" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input placeholder="Mô tả khảo sát" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {form.questions.length > 0 && (
            <div className="space-y-2">
              <Label>Câu hỏi đã thêm ({form.questions.length})</Label>
              {form.questions.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-[hsl(var(--secondary))] text-sm">
                  <span className="flex-1 truncate">{i + 1}. {q.question}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{q.type}</Badge>
                    <button onClick={() => setForm(prev => ({ ...prev, questions: prev.questions.filter((_, idx) => idx !== i) }))}
                      className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] text-xs ml-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-[hsl(var(--border))] rounded-lg p-3 space-y-3">
            <Label className="text-sm font-medium">Thêm câu hỏi</Label>
            <Input placeholder="Nội dung câu hỏi" value={newQuestion.question}
              onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} />
            <select className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm"
              value={newQuestion.type}
              onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as QuestionType })}>
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(newQuestion.type) && (
              <textarea className="w-full min-h-20 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-none focus:outline-none"
                placeholder="Mỗi lựa chọn 1 dòng..." value={newQuestion.options}
                onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })} />
            )}
            <Button size="sm" variant="outline" onClick={addQuestion} className="w-full">+ Thêm câu hỏi này</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang lưu...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const HrSurveysPage: React.FC = () => {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Survey | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hr-surveys'], queryFn: surveyApi.getAll })
  const surveys: Survey[] = (data?.data as any)?.data ?? data?.data ?? []

  const createMut = useMutation({
    mutationFn: (form: FormState) => surveyApi.create(form as CreateSurveyDto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-surveys'] }); setCreateOpen(false); toast.success('Tạo khảo sát thành công') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Tạo thất bại')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSurveyDto }) => surveyApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-surveys'] }); setEditTarget(null); toast.success('Đã cập nhật khảo sát') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Cập nhật thất bại')),
  })

  const publishMut = useMutation({
    mutationFn: surveyApi.publish,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-surveys'] }); toast.success('Đã publish khảo sát') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Publish thất bại')),
  })

  const closeMut = useMutation({
    mutationFn: surveyApi.close,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-surveys'] }); toast.success('Đã đóng khảo sát') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Đóng thất bại')),
  })

  const editInitialData = editTarget
    ? {
        title: editTarget.title,
        description: editTarget.description ?? '',
        questions: (editTarget.questions ?? []).map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required,
        })),
      }
    : emptyForm()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Khảo sát</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Tạo và quản lý khảo sát định kỳ</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo khảo sát
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-[hsl(var(--destructive))]">Không thể tải danh sách khảo sát. Kiểm tra kết nối hoặc đăng nhập lại.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">• {s._count?.questions ?? 0} câu • {s._count?.responses ?? 0} lượt trả lời</span>
                    </div>
                    <p className="font-medium">{s.title}</p>
                    {s.description && <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{s.description}</p>}
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link to={`/hr/surveys/${s.id}/results`}><BarChart3 className="h-3.5 w-3.5" /> Kết quả</Link>
                    </Button>
                    {s.status === 'DRAFT' && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditTarget(s)}>
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </Button>
                    )}
                    {s.status === 'DRAFT' && (
                      <Button size="sm" className="gap-1" onClick={() => publishMut.mutate(s.id)}>
                        <Play className="h-3.5 w-3.5" /> Publish
                      </Button>
                    )}
                    {s.status === 'ACTIVE' && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => closeMut.mutate(s.id)}>
                        <Square className="h-3.5 w-3.5" /> Đóng
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {surveys.length === 0 && (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Chưa có khảo sát nào</p>
            </div>
          )}
        </div>
      )}

      <SurveyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo khảo sát mới"
        initialData={emptyForm()}
        onSubmit={(form) => createMut.mutate(form)}
        isPending={createMut.isPending}
        submitLabel="Tạo khảo sát"
      />

      <SurveyFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null) }}
        title="Sửa khảo sát"
        initialData={editInitialData}
        onSubmit={(form) => editTarget && updateMut.mutate({ id: editTarget.id, data: form })}
        isPending={updateMut.isPending}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}

export default HrSurveysPage
