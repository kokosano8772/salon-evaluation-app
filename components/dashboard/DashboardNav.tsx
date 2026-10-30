"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Database,
  LineChart,
  FileText,
  Trophy,
  Archive,
  Bot,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LOGIN_PATH = "/dashboard/login";

interface NavLink {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

interface NavGroup {
  type: "group";
  label: string;
  icon: LucideIcon;
  children: { href: string; label: string; exact: boolean }[];
}

type NavEntry = NavLink | NavGroup;

// 価値診断・AIチェックはそれぞれ簡易/プロの2つがあり、以前は4つのリンクを
// フラットに並べていたが「ごちゃごちゃしてる」とのことで、親項目をクリックすると
// 簡易/プロを選べるグループ形式に変更した。
const NAV_ITEMS: NavEntry[] = [
  { type: "link", href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  {
    type: "group",
    label: "価値診断",
    icon: ClipboardCheck,
    children: [
      { href: "/quick", label: "簡易", exact: false },
      { href: "/diagnosis", label: "プロ", exact: false },
    ],
  },
  {
    type: "group",
    label: "AIチェック",
    icon: Bot,
    children: [
      { href: "/ai-check", label: "簡易", exact: true },
      { href: "/ai-check/pro", label: "プロ", exact: true },
    ],
  },
  { type: "link", href: "/dashboard/stores", label: "成長データベース", icon: Database, exact: false },
  { type: "link", href: "/dashboard/vault", label: "診断結果の保管庫", icon: Archive, exact: false },
  { type: "link", href: "/dashboard/analysis", label: "月次分析", icon: LineChart, exact: false },
  { type: "link", href: "/dashboard/reports", label: "レポート", icon: FileText, exact: false },
  { type: "link", href: "/dashboard/web-ranking", label: "WEBランキング", icon: Trophy, exact: false },
];

// モバイルの横スクロールナビは開閉のUIが馴染まないため、グループは子項目を
// フラットに展開して並べる（以前のAIチェック（簡易）/（プロ）のような見た目）。
const MOBILE_NAV_ITEMS = NAV_ITEMS.flatMap((item) =>
  item.type === "link"
    ? [item]
    : item.children.map((c) => ({
        type: "link" as const,
        href: c.href,
        label: `${item.label}（${c.label}）`,
        icon: item.icon,
        exact: c.exact,
      }))
);

function isChildActive(pathname: string, children: NavGroup["children"]) {
  return children.some((c) => (c.exact ? pathname === c.href : pathname.startsWith(c.href)));
}

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  // 現在地を含むグループは最初から開いた状態にする。
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () =>
      new Set(
        NAV_ITEMS.filter((i): i is NavGroup => i.type === "group" && isChildActive(pathname, i.children)).map(
          (i) => i.label
        )
      )
  );

  if (pathname === LOGIN_PATH) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(LOGIN_PATH);
    router.refresh();
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    // sticky + min-h-screenだと、親のflexレイアウト（align-items:stretchの既定値）に
    // よって親コンテンツ（ページ本文）の高さまで引き伸ばされてしまい、結果として
    // フッター（ログアウトボタン）がそのページの最後尾まで押し下げられる不具合が
    // あった（サイドバー自体はスクロールに追従するように見えても、ログアウトボタンは
    // 画面内に収まらない）。fixedで確実にビューポート基準の高さに固定する。
    <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 border-r border-gray-100 bg-white h-screen fixed top-0 left-0 overflow-y-auto z-20">
      <div className="px-6 pt-8 pb-6">
        <span className="text-[#C4788A] text-[11px] font-medium tracking-[0.25em] uppercase">
          Salon Value Score
        </span>
        <p className="text-charcoal-900 font-bold text-lg mt-1">成長データベース</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.type === "link") {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
          }

          const isOpen = openGroups.has(item.label);
          const hasActiveChild = isChildActive(pathname, item.children);
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  hasActiveChild
                    ? "bg-[#C4788A14] text-[#A85E74]"
                    : "text-charcoal-600 hover:bg-gray-50 hover:text-charcoal-900"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="mt-1 ml-[1.625rem] pl-3 border-l border-gray-100 space-y-0.5">
                  {item.children.map((child) => {
                    const isActive = child.exact ? pathname === child.href : pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#C4788A14] text-[#A85E74]"
                            : "text-charcoal-500 hover:bg-gray-50 hover:text-charcoal-900"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
        {MOBILE_NAV_ITEMS.map((item) => {
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
