import React from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const PendingPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
    <Card className="w-full max-w-md text-center">
      <CardContent className="pt-10 pb-8 space-y-4">
        <Clock className="h-14 w-14 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-bold">Tài khoản đang chờ duyệt</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Tài khoản của bạn đã được tạo thành công.<br />
          Admin sẽ xét duyệt và gửi thông báo qua email khi hoàn tất.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full mt-2">Quay lại đăng nhập</Button>
        </Link>
      </CardContent>
    </Card>
  </div>
)

export default PendingPage
