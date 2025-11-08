// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClientWithCookies } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login', request.url));

  // ★ 非同期にしたので await
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?error=oauth', request.url));

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
