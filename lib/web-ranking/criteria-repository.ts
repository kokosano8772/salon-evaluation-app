import { createAdminClient } from "@/lib/supabase/admin";
import { RankingApplicability, RankingCriteriaItem, RankingCriteriaVersion, RankingEvaluationMethod, RankingSiteType } from "./types";

// site_typeに対する採点基準を取得する。statusが'active'のものを優先し、
// 無ければ最新の'draft'にフォールバックする（検証中はdraftのまま診断を試せるように
// するため。検証が済んだらranking_criteria_versions.statusをactiveに切り替える
// 運用を想定）。
export async function getCriteriaVersionForSiteType(
  siteType: RankingSiteType
): Promise<{ version: RankingCriteriaVersion; items: RankingCriteriaItem[] } | null> {
  const admin = createAdminClient();

  const { data: activeRow } = await admin
    .from("ranking_criteria_versions")
    .select("*")
    .eq("site_type", siteType)
    .eq("status", "active")
    .maybeSingle();

  let versionRow = activeRow;
  if (!versionRow) {
    const { data: draftRow } = await admin
      .from("ranking_criteria_versions")
      .select("*")
      .eq("site_type", siteType)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    versionRow = draftRow;
  }
  if (!versionRow) return null;

  const { data: itemRows, error: itemsError } = await admin
    .from("ranking_criteria_items")
    .select("*")
    .eq("criteria_version_id", versionRow.id)
    .order("sort_order");
  if (itemsError || !itemRows) return null;

  return {
    version: {
      id: versionRow.id,
      siteType: versionRow.site_type as RankingSiteType,
      versionLabel: versionRow.version_label,
      status: versionRow.status as "draft" | "active" | "archived",
      description: versionRow.description,
    },
    items: itemRows.map((r) => ({
      id: r.id,
      criteriaVersionId: r.criteria_version_id,
      itemKey: r.item_key,
      category: r.category,
      label: r.label,
      maxScore: Number(r.max_score),
      evaluationMethod: r.evaluation_method as RankingEvaluationMethod,
      applicability: r.applicability as RankingApplicability,
      sortOrder: r.sort_order,
    })),
  };
}
