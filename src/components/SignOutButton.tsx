'use client';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const onClick = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <button onClick={onClick} className="rounded px-3 py-2 border">
      ログアウト
    </button>
  );
}
