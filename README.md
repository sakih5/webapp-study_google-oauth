# webapp-study_google-oauth

Next.js 14 + Supabase Auth + Google OAuth を使った認証機能の学習リポジトリ

## 概要

このリポジトリは、Next.js 14 (App Router) と Supabase Auth を使用して、Google アカウントによるソーシャルログイン機能を実装したサンプルアプリケーションです。無料で利用できるサービスのみで構成されており、個人開発や学習に最適です。

## 技術スタック

- **Next.js 14** (App Router)
- **Supabase Auth** (認証・セッション管理)
- **@supabase/ssr** (Server-Side Rendering対応)
- **TypeScript**

## 認証フロー

```text
ユーザー → Next.js /login
  → Supabase Auth (signInWithOAuth)
    → Google OAuth 認証画面
      → Supabase (コールバック処理)
        → Next.js /auth/callback (セッション確立)
          → /dashboard (認証済みページ)
```

重要なポイント：Next.jsが直接Googleと通信せず、**常にSupabaseが中継役**として機能します。

## ディレクトリ構成

```text
src/
├── app/
│   ├── auth/callback/
│   │   └── route.ts          # OAuth認証後のコールバック処理
│   ├── dashboard/
│   │   └── page.tsx          # 認証が必要なページ（ダッシュボード）
│   ├── login/
│   │   └── page.tsx          # ログインページ
│   └── layout.tsx            # ルートレイアウト
├── components/
│   └── SignOutButton.tsx     # ログアウトボタンコンポーネント
└── lib/supabase/
    ├── client.ts             # クライアントサイド用Supabaseクライアント
    └── server.ts             # サーバーサイド用Supabaseクライアント
```

## 実装のポイント

### 1. クライアント/サーバーでのSupabaseクライアント分離

**クライアントサイド (`src/lib/supabase/client.ts`)**

```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';
```

- ブラウザで実行されるコンポーネント用
- ログインボタンやログアウトボタンで使用

**サーバーサイド (`src/lib/supabase/server.ts`)**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
```

- Server Components や Route Handlers で使用
- `cookies()` APIを使ってセッション情報を管理
- **重要**: Next.js 15以降では `cookies()` が Promise を返すため `await` が必須

### 2. OAuth認証の開始 (`src/app/login/page.tsx`)

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`,  // Next.js側のコールバックURL
  },
});
```

**ポイント**:

- `redirectTo` に指定するのは**Next.jsアプリ内のURL** (`/auth/callback`)
- GoogleのOAuthコールバックURLは `https://<project-ref>.supabase.co/auth/v1/callback` であり、Supabase側で自動処理される

### 3. コールバック処理 (`src/app/auth/callback/route.ts`)

```typescript
const code = searchParams.get('code');
const supabase = await createServerClientWithCookies();
await supabase.auth.exchangeCodeForSession(code);
```

**ポイント**:

- GoogleからSupabaseを経由して返ってきた認証コード（`code`）をセッションに変換
- この処理でCookieにセッション情報が保存される
- エラー時は `/login` にリダイレクト

### 4. 認証状態の確認 (`src/app/dashboard/page.tsx`)

```typescript
const supabase = await createServerClientWithCookies();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login');
```

**ポイント**:

- Server Componentで認証状態をチェック
- 未認証の場合はログインページへリダイレクト
- サーバーサイドで処理されるため、クライアント側で認証情報が露出しない

### 5. ログアウト処理 (`src/components/SignOutButton.tsx`)

```typescript
const supabase = createClient();
await supabase.auth.signOut();
window.location.href = '/login';
```

**ポイント**:

- クライアントサイドで実行
- `signOut()` でSupabase側のセッションを破棄
- ページ遷移は `window.location.href` を使用（Next.js Routerでも可）

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. Project Settings → API から以下を取得:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Google Cloud Consoleの設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアント ID」を作成
3. 承認済みのリダイレクトURIに以下を追加:

   ```text
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   ※これはSupabaseのコールバックURLです（Next.jsのものではありません）

4. クライアントIDとシークレットを取得

### 4. Supabase側のGoogle Provider設定

1. Supabase Dashboard → Authentication → Providers
2. Googleを有効化
3. Google Cloud Consoleで取得したクライアントIDとシークレットを設定

### 5. 環境変数の設定

`.env.local` ファイルを作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 本番環境では実際のURLに変更
```

**注意**: `NEXT_PUBLIC_` プレフィックスはブラウザ側でも参照可能になるため、公開情報のみに使用してください。

### 6. 起動

```bash
npm run dev
```

`http://localhost:3000/login` にアクセスしてGoogle認証をテストできます。

## 本番環境へのデプロイ

### Vercelへのデプロイ時の注意点

1. **Site URLの設定**: Supabase Dashboard → Authentication → URL Configuration で `Site URL` を本番環境のURLに変更
   - 例: `https://your-app.vercel.app`

2. **環境変数の設定**: Vercelの環境変数に `.env.local` の内容を追加

3. **Google OAuthの承認済みURIに本番URLを追加**:
   - 開発環境と本番環境でコールバックURLが異なる場合、両方を登録する必要があります
   - Supabaseの `Site URL` は1つしか設定できないため、環境ごとに切り替えが必要

## よくあるトラブルと対処法

### コールバックURLの混同

- **Googleのリダイレクト先**: `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase)
- **Next.jsのコールバック**: `/auth/callback` (アプリ内)
- この2つは異なるものです。Google Cloud Consoleに設定するのは前者です。

### cookies() が Promise を返すエラー

- Next.js 15以降では `cookies()` が非同期になったため、必ず `await` してください
- `src/lib/supabase/server.ts:7` で実装済み

### セッションが保持されない

- Server ComponentsでSupabaseクライアントを使う際は、必ず `createServerClient` を使用
- Cookie操作の `get`, `set`, `remove` が正しく実装されているか確認

## 参考資料

- [Next.js 14 + Supabase でGoogle OAuth認証](https://zenn.dev/micchi55555/articles/7f0bef8ec5ebbf) - 本実装のベース記事
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
