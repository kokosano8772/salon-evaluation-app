"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Database,
  LineChart as LineChartIcon,
  Sparkles,
  GitCompare,
  FileText,
  Store as StoreIcon,
  TrendingUp,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import HubTile from "@/components/dashboard/HubTile";
import ComingSoonTile from "@/components/dashboard/ComingSoonTile";
import * as repo from "@/lib/growth-db/repository";

export default function DashboardHubPage() {
  const [storeCount, setStoreCount] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  useEffect(() => {
    repo.getStores({ pageSize: 1000 }).then(async ({ items, total }) => {
      setStoreCount(total);
      const scores = await Promise.all(items.map((s) => repo.getLatestGrowthScore(s.id)));
      const valid = scores.filter((s): s is NonNullable<typeof s> => s !== null);
      if (valid.length > 0) {
        setAverageScore(Math.round(valid.reduce((sum, s) => sum + s.totalScore, 0) / valid.length));
      }
    });
  }, []);

  return (
    <div>
      <DashboardHeader
        title="ダッシュボード"
        description="美容室価値診断から成長データベースまで、一つのサービスとして繋がっています。"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="登録店舗数"
          value={storeCount ?? "-"}
          icon={<StoreIcon size={16} strokeWidth={1.8} color="#C4788A" />}
        />
        <StatCard
          label="平均総合スコア"
          value={averageScore !== null ? `${averageScore}点` : "-"}
          icon={<TrendingUp size={16} strokeWidth={1.8} color="#C4788A" />}
        />
      </div>

      <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">メニュー</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <HubTile
          href="/quick"
          title="美容室価値診断"
          description="約1分でサロンの「選ばれ続ける力」を100点満点で診断します。"
          icon={ClipboardCheck}
          color="#C4788A"
        />
        <HubTile
          href="/dashboard/stores"
          title="成長データベース"
          description="店舗ごとの月次データを蓄積し、独自診断スコアで継続的に分析します。"
          icon={Database}
          color="#7C9EB5"
        />
        <HubTile
          href="/dashboard/analysis"
          title="月次分析"
          description="複数店舗の総合スコア推移を比較し、成長トレンドを把握します。"
          icon={LineChartIcon}
          color="#6BAB8A"
        />
      </div>

      <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">近日公開</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonTile title="AI分析" description="AIによる自動診断・改善提案を予定しています。" icon={Sparkles} />
        <ComingSoonTile title="比較分析" description="同規模店舗・地域平均との比較を予定しています。" icon={GitCompare} />
        <ComingSoonTile title="レポート" description="PDF・CSV形式でのレポート出力を予定しています。" icon={FileText} />
      </div>
    </div>
  );
}
