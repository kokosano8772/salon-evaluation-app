import { Database } from "@/lib/supabase/database.types";
import { BotConfig, FlowVersion, KnowledgeItem, KnowledgeSource, NotificationContact, UsageDay } from "@/components/chatbot/types";

type BotConfigRow = Database["public"]["Tables"]["chatbot_bot_configs"]["Row"];
type NotificationContactRow = Database["public"]["Tables"]["chatbot_notification_contacts"]["Row"];
type KnowledgeSourceRow = Database["public"]["Tables"]["chatbot_knowledge_sources"]["Row"];
type KnowledgeItemRow = Database["public"]["Tables"]["chatbot_knowledge_items"]["Row"];
type FlowVersionRow = Database["public"]["Tables"]["chatbot_flow_versions"]["Row"];
type UsageDailyRow = Database["public"]["Tables"]["chatbot_usage_daily"]["Row"];

export function mapBotConfig(row: BotConfigRow): BotConfig {
  return {
    id: row.id,
    storeId: row.store_id,
    publicBotId: row.public_bot_id,
    status: row.status,
    mode: row.mode,
    allowedDomains: Array.isArray(row.allowed_domains) ? row.allowed_domains : [],
    theme: (row.theme as Record<string, unknown>) ?? {},
    rateLimitPerMinute: row.rate_limit_per_minute,
    rateLimitPerDay: row.rate_limit_per_day,
    aiMonthlyTokenLimit: row.ai_monthly_token_limit,
    aiMonthlyCostLimitUsd: row.ai_monthly_cost_limit_usd,
    draftSystemPrompt: row.draft_system_prompt,
    publishedSystemPrompt: row.published_system_prompt,
    promptPublishedAt: row.prompt_published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotificationContact(row: NotificationContactRow): NotificationContact {
  return {
    id: row.id,
    storeId: row.store_id,
    email: row.email,
    name: row.name,
    isPrimary: row.is_primary,
    isActive: row.is_active,
  };
}

export function mapKnowledgeSource(row: KnowledgeSourceRow): KnowledgeSource {
  return {
    id: row.id,
    storeId: row.store_id,
    sourceType: row.source_type,
    url: row.url,
    fetchedContent: row.fetched_content,
    fetchedContentHash: row.fetched_content_hash,
    fetchedAt: row.fetched_at,
    approvedContent: row.approved_content,
    approvedContentHash: row.approved_content_hash,
    approvedAt: row.approved_at,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function mapKnowledgeItem(row: KnowledgeItemRow): KnowledgeItem {
  return {
    id: row.id,
    storeId: row.store_id,
    sourceId: row.source_id,
    itemType: row.item_type,
    category: row.category,
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function mapFlowVersion(row: FlowVersionRow): FlowVersion {
  return {
    id: row.id,
    storeId: row.store_id,
    version: row.version,
    draftJson: (row.draft_json as Record<string, unknown>) ?? {},
    publishedJson: row.published_json as Record<string, unknown> | null,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export function mapUsageDay(row: UsageDailyRow): UsageDay {
  return {
    date: row.date,
    chatMessageCount: row.chat_message_count,
    aiResponseCount: row.ai_response_count,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    estimatedCostUsd: row.estimated_cost_usd,
    applicationSuccessCount: row.application_success_count,
    applicationFailureCount: row.application_failure_count,
    widgetLoadCount: row.widget_load_count,
  };
}
