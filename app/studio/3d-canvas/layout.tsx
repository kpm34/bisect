// Force dynamic rendering to avoid SSR issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
