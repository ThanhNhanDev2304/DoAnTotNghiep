import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Users, Mail, Phone, Building2, Briefcase, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/api/users'
import { getApiErrorMessage } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PendingUsersPage: React.FC = () => {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: usersApi.getPending,
    refetchInterval: 30000,
  })
  const users: any[] = (data?.data as any)?.data ?? data?.data ?? []

  const approveMut = useMutation({
    mutationFn: (id: string) => usersApi.approveAccount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-users'] }); toast.success('Đã duyệt tài khoản') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Duyệt thất bại')),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => usersApi.rejectAccount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-users'] }); toast.success('Đã từ chối và xóa tài khoản') },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Từ chối thất bại')),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Duyệt tài khoản</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Danh sách tài khoản nhân viên đang chờ phê duyệt
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Đang tải...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-[hsl(var(--muted-foreground))]">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Không có tài khoản nào đang chờ duyệt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{u.fullName ?? u.userName}</span>
                      {u.employeeCode && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <BadgeCheck className="h-3 w-3" />{u.employeeCode}
                        </Badge>
                      )}
                      {u.accountType === 'google' && (
                        <Badge variant="outline" className="text-xs">Google</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />{u.email}
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" />{u.phone}
                        </span>
                      )}
                      {u.departmentName && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />{u.departmentName}
                        </span>
                      )}
                      {u.positionName && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />{u.positionName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Đăng ký lúc {new Date(u.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => rejectMut.mutate(u.id)}
                      disabled={rejectMut.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => approveMut.mutate(u.id)}
                      disabled={approveMut.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Duyệt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingUsersPage
