import { requireUser } from '@/lib/auth/dal';
import { DashboardSidebar } from './sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 權威驗證：涵蓋所有 /dashboard/* 子頁（不只靠 proxy 的樂觀檢查）。
  await requireUser();

  return <DashboardSidebar>{children}</DashboardSidebar>;
}
