// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerClientWithCookies } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/SignOutButton';

export default async function DashboardPage() {
  // ★ 非同期にしたので await
  const supabase = await createServerClientWithCookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-bold">ダッシュボード</h1>
      <p>ようこそ、{user.email}</p>
      <SignOutButton />
    </main>
  );
}
