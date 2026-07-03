"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Lock size={28} strokeWidth={1.8} color="white" />
          </div>
          <span className="text-[#C4788A] text-xs font-medium tracking-[0.25em] uppercase mb-2">
            Salon Value Score
          </span>
          <h1 className="text-charcoal-900 text-2xl font-bold text-center">成長データベース</h1>
          <p className="text-gray-500 text-sm text-center mt-2">運営スタッフ用ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="card-luxury p-6 space-y-4">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
            />
          </label>

          {error && (
            <p className="text-red-500 text-sm text-center">メールアドレスまたはパスワードが正しくありません</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
