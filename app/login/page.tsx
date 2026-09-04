"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-xl">
            🖼️
          </div>
          <h1 className="text-lg font-bold">参考画像ライブラリ</h1>
          <p className="mt-1 text-sm text-muted">自分専用のデザイン参考ツール</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl2 border border-line bg-surface p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="you@example.com"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">パスワード</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-faint">
          アカウントは Supabase 側で1つだけ作成しておく個人利用アプリです
        </p>
      </div>
    </div>
  );
}
