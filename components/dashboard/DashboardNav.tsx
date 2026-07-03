"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Database,
  LineChart,
  Sparkles,
  GitCompare,
  FileText,
  Lock,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LOGIN_PATH = "/dashboard/login";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/quick", label: "美容室価値診断", icon: ClipboardCheck, exact: false },
  { href: "/dashboard/stores", label: "成長データベース", icon: Database, exact: false },
  { href: "/dashboard/analysis", label: "月次分析", icon: LineChart, exact: false },
];

const COMING_SOON_ITEMS = [
  { label: "AI分析", icon: Sparkles },
  { label: "比較分析", icon: GitCompare },
  { label: "レポート", icon: FileText },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === LOGIN_PATH) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(LOGIN_PATH);
    router.refresh();
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 border-r border-gray-100 bg-white min-h-screen sticky top-0">
      <div className="px-6 pt-8 pb-6">
        <span className="text-[#C4788A] text-[11px] font-medium tracking-[0.25em] uppercase">
          Salon Value Score
        </span>
        <p className="text-charcoal-900 font-bold text-lg mt-1">成長データベース</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#C4788A14] text-[#A85E74]"
                  : "text-charcoal-600 hover:bg-gray-50 hover:text-charcoal-900"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            近日公開
          </p>
          {COMING_SOON_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed"
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </span>
                <Lock size={13} strokeWidth={2} />
              </div>
            );
          })}
        </div>
      </nav>

      <div className="px-6 py-6 space-y-3">
        <a
          href="https://koko-design.com/contact/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-semibold text-white rounded-xl py-3"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          サポートに相談する
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 py-1"
        >
          <LogOut size={13} strokeWidth={2} />
          ログアウト
        </button>
      </div>
    </aside>
  );
}

// md未満の画面幅向け：横スクロールできる簡易ナビ
export function DashboardMobileNav() {
  const pathname = usePathname();

  if (pathname === LOGIN_PATH) return null;

  return (
    <nav className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 overflow-x-auto">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive ? "bg-[#C4788A14] text-[#A85E74]" : "text-charcoal-500"
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
