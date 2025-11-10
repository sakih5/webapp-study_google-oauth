'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const onClickGoogle = useCallback(async () => {
    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ログイン完了後に戻すURL（Next.js 側のコールバック）
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold mb-4">ログイン</h1>
      <button
        onClick={onClickGoogle}
        className="rounded-lg px-4 py-2 border"
      >
        Googleでログイン
      </button>
    </main>
  );
}
