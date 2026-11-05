export type BotStatus = "draft" | "published" | "archived";
export type BotMode = "choice" | "ai" | "hybrid";

export interface BotSummary {
  id: string;
  storeId: string;
  storeName: string;
  publicBotId: string;
  status: BotStatus;
  mode: BotMode;
  updatedAt: string;
}

export interface BotConfig {
  id: string;
  storeId: string;
  publicBotId: string;
  status: BotStatus;
  mode: BotMode;
  allowedDomains: string[];
  theme: Record<string, unknown>;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  aiMonthlyTokenLimit: number | null;
  aiMonthlyCostLimitUsd: number | null;
  draftSystemPrompt: string;
  publishedSystemPrompt: string;
  promptPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationContact {
  id: string;
  storeId: string;
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

export const ITEM_TYPE_LABEL = {
  salary: "給与",
  holiday: "休日",
  location: "勤務地",
  hours: "勤務時間",
  benefits: "福利厚生",
  requirements: "応募条件",
  training: "研修",
  selection_flow: "選考フロー",
  faq: "FAQ",
  other: "その他",
} as const;

export type KnowledgeItemType = keyof typeof ITEM_TYPE_LABEL;

export interface KnowledgeItem {
  id: string;
  storeId: string;
  sourceId: string | null;
  itemType: KnowledgeItemType;
  category: string;
  title: string;
  body: string;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export const SOURCE_TYPE_LABEL = {
  recruitment_lp: "求人LP（自動取り込み）",
  manual_url: "手動URL",
  manual_text: "手入力",
} as const;

export const SOURCE_STATUS_LABEL = {
  pending: "未取得",
  fetched: "取得済み・未承認",
  approved: "承認済み",
  rejected: "却下",
  stale: "再取得あり・要確認",
} as const;

export interface KnowledgeSource {
  id: string;
  storeId: string;
  sourceType: keyof typeof SOURCE_TYPE_LABEL;
  url: string;
  fetchedContent: string;
  fetchedContentHash: string;
  fetchedAt: string | null;
  approvedContent: string;
  approvedContentHash: string;
  approvedAt: string | null;
  status: keyof typeof SOURCE_STATUS_LABEL;
  updatedAt: string;
}

export interface FlowVersion {
  id: string;
  storeId: string;
  version: number;
  draftJson: Record<string, unknown>;
  publishedJson: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface UsageDay {
  date: string;
  chatMessageCount: number;
  aiResponseCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  applicationSuccessCount: number;
  applicationFailureCount: number;
  widgetLoadCount: number;
}

export interface ErrorLogEntry {
  id: string;
  errorCode: string;
  errorSource: string;
  message: string;
  createdAt: string;
}
