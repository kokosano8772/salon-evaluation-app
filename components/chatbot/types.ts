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

export const APPLY_ACTION_METHOD_LABEL = {
  email: "メール応募（チャット内で入力を収集）",
  line: "LINE応募（LINE公式アカウントへ誘導）",
  external_form: "外部フォーム（外部URLへ誘導）",
  phone: "電話問い合わせ（電話番号を案内）",
} as const;

export type ApplyActionMethod = keyof typeof APPLY_ACTION_METHOD_LABEL;

export const FLOW_NODE_TYPE_LABEL = {
  start: "開始",
  choice: "選択肢",
  text_input: "自由入力",
  notice: "案内文",
  apply_action: "応募導線（終端）",
  end: "終了",
} as const;

export type FlowNodeType = keyof typeof FLOW_NODE_TYPE_LABEL;

// lib/chatbot/flow-validation.ts（サーバー側）のFlowNodeと必ず一致させること。
// こちらはクライアントコンポーネントから使う複製（service_roleを扱うモジュールを
// クライアントバンドルに引き込まないため、見積もり機能等と同じ方針）。
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  text?: string;
  nextNodeId?: string;
  options?: { label: string; nextNodeId: string }[];
  method?: ApplyActionMethod;
  fields?: {
    askPhone?: boolean;
    askDesiredPosition?: boolean;
    askEmploymentType?: boolean;
  };
  lineUrl?: string;
  externalFormUrl?: string;
  phoneNumber?: string;
}

export interface Flow {
  nodes: FlowNode[];
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
