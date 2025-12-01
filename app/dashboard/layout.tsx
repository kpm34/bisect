import { DashboardShell } from '@/components/dashboard/DashboardShell';

// Force dynamic rendering to avoid SSR issues with usePathname
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
