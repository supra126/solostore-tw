import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/dal';

// 受保護頁面：在頁面層用 DAL 做「權威」驗證（不只靠 proxy 的樂觀檢查）。
export default async function DashboardOverviewPage() {
  const user = await requireUser();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">總覽</h1>
      <Card>
        <CardHeader>
          <CardTitle>帳號</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">姓名</dt>
              <dd className="font-medium">{user.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">電子郵件</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">角色</dt>
              <dd className="font-medium capitalize">{user.role}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
