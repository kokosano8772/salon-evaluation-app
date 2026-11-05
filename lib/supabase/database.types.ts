// supabase/migrations/0001_init.sql と対応する手書きの型定義。
// スキーマ変更時はこのファイルも合わせて更新すること。
// @supabase/postgrest-js の GenericSchema 制約に合わせ、各テーブルに
// Row/Insert/Update/Relationships、スキーマに Tables/Views/Functions を
// 揃えて定義する必要がある（一部でも欠けると型解決が silently `never` になる）。

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          phone: string;
          area: string;
          opened_year: number | null;
          store_count: number | null;
          seat_count: number | null;
          business_hours: string;
          business_days: string;
          staff_count: number | null;
          target_customer: string;
          average_unit_price: number | null;
          trade_area: string;
          store_format: string;
          business_category: string;
          homepage_urls: unknown;
          hotpepper_urls: unknown;
          recruitment_lp_urls: unknown;
          google_ads_active: boolean;
          meta_ads_active: boolean;
          ad_sync_defaults: unknown;
          latest_score: number | null;
          latest_score_year_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["stores"]["Row"], "id" | "created_at" | "updated_at">> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
        Relationships: [];
      };
      monthly_metrics: {
        Row: {
          id: string;
          store_id: string;
          year_month: string;
          revenue: unknown | null;
          acquisition: unknown | null;
          repeat_metrics: unknown | null;
          google_business: unknown | null;
          website: unknown | null;
          sns: unknown | null;
          recruiting: unknown | null;
          retention: unknown | null;
          productivity: unknown | null;
          brand: unknown | null;
          management: unknown | null;
          basic_snapshot: unknown | null;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["monthly_metrics"]["Row"], "id">> & {
          store_id: string;
          year_month: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_metrics"]["Row"]>;
        Relationships: [];
      };
      diagnosis_results: {
        Row: {
          id: string;
          store_id: string | null;
          salon_name: string;
          salon_phone: string;
          total_score: number;
          rank: string;
          category_scores: unknown;
          answers: unknown;
          completed_at: string;
          status: "pending" | "reviewed";
          created_at: string;
        };
        Insert: never; // 書き込みは必ずRPC経由
        // status: レビュー済みフラグの更新用。store_id: 保管庫からの手動連携（電話番号・氏名の
        // 自動マッチが外れて別店舗として重複登録された場合の付け替え）専用。それ以外の列は
        // RPC経由で書き込む想定のため含めない。
        Update: Partial<Pick<Database["public"]["Tables"]["diagnosis_results"]["Row"], "status" | "store_id">>;
        Relationships: [];
      };
      competitor_research_sessions: {
        Row: {
          id: string;
          store_id: string;
          region: string;
          mode: "attraction" | "recruitment" | "both";
          competitor_count: number;
          salons: unknown;
          cell_data: unknown;
          ai_result: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["competitor_research_sessions"]["Row"], "id" | "created_at" | "updated_at">> & {
          store_id: string;
          region: string;
          mode: "attraction" | "recruitment" | "both";
        };
        Update: Partial<Database["public"]["Tables"]["competitor_research_sessions"]["Row"]>;
        Relationships: [];
      };
      ad_reports: {
        Row: {
          id: string;
          store_id: string;
          year_month: string;
          platform: "google" | "meta";
          category: "acquisition" | "recruitment";
          account_id: string;
          spend: number;
          impressions: number;
          clicks: number;
          ctr: number;
          cpc: number;
          conversions: number;
          cpa: number;
          cvr: number;
          reach: number | null;
          frequency: number | null;
          campaigns: unknown;
          gender_breakdown: unknown | null;
          hourly_clicks: unknown | null;
          age_group_clicks: unknown | null;
          age_group_conversions: unknown | null;
          conversion_action_breakdown: unknown | null;
          search_terms: unknown | null;
          target_age_range: string;
          ai_result: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ad_reports"]["Row"], "id" | "created_at" | "updated_at">> & {
          store_id: string;
          year_month: string;
          platform: "google" | "meta";
        };
        Update: Partial<Database["public"]["Tables"]["ad_reports"]["Row"]>;
        Relationships: [];
      };
      api_tokens: {
        Row: {
          provider: string;
          access_token: string;
          expires_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["api_tokens"]["Row"]> & {
          provider: string;
          access_token: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_tokens"]["Row"]>;
        Relationships: [];
      };
      ai_check_diagnoses: {
        Row: {
          id: string;
          url: string;
          tier: string;
          total_score: number;
          score_max: number;
          rank: string | null;
          summary: string;
          target: string;
          strengths: unknown;
          weaknesses: unknown;
          missing_information: unknown;
          recommendations: unknown;
          category_scores: unknown;
          diagnosis_items: unknown;
          manual_answers: unknown;
          salon_name: string;
          suggested_queries: unknown;
          search_check_results: unknown;
          search_check_run_at: string | null;
          crawl_warning: string | null;
          client_ip: string | null;
          created_at: string;
          linked_store_id: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ai_check_diagnoses"]["Row"], "id" | "created_at">> & {
          url: string;
          tier: string;
          total_score: number;
          score_max: number;
        };
        Update: Partial<Database["public"]["Tables"]["ai_check_diagnoses"]["Row"]>;
        Relationships: [];
      };
      ranking_salons: {
        Row: {
          id: string;
          name: string;
          business_category: string;
          prefecture: string;
          city: string;
          address: string;
          store_count: number | null;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_salons"]["Row"], "id" | "created_at" | "updated_at">> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_salons"]["Row"]>;
        Relationships: [];
      };
      ranking_web_assets: {
        Row: {
          id: string;
          salon_id: string;
          site_type: string;
          url: string;
          label: string;
          is_active: boolean;
          registered_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_web_assets"]["Row"], "id" | "created_at" | "updated_at">> & {
          salon_id: string;
          site_type: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_web_assets"]["Row"]>;
        Relationships: [];
      };
      ranking_criteria_versions: {
        Row: {
          id: string;
          site_type: string;
          version_label: string;
          status: string;
          description: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_criteria_versions"]["Row"], "id" | "created_at">> & {
          site_type: string;
          version_label: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_criteria_versions"]["Row"]>;
        Relationships: [];
      };
      ranking_criteria_items: {
        Row: {
          id: string;
          criteria_version_id: string;
          item_key: string;
          category: string;
          label: string;
          max_score: number;
          evaluation_method: string;
          applicability: string;
          sort_order: number;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_criteria_items"]["Row"], "id">> & {
          criteria_version_id: string;
          item_key: string;
          category: string;
          label: string;
          max_score: number;
          evaluation_method: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_criteria_items"]["Row"]>;
        Relationships: [];
      };
      ranking_audit_runs: {
        Row: {
          id: string;
          web_asset_id: string;
          criteria_version_id: string;
          status: string;
          crawl_warning: string | null;
          crawl_error: string | null;
          total_score: number | null;
          total_max_score: number | null;
          review_status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          triggered_by: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_audit_runs"]["Row"], "id" | "created_at">> & {
          web_asset_id: string;
          criteria_version_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_audit_runs"]["Row"]>;
        Relationships: [];
      };
      ranking_audit_scores: {
        Row: {
          id: string;
          audit_run_id: string;
          criteria_item_id: string;
          score: number;
          max_score: number;
          status: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_audit_scores"]["Row"], "id">> & {
          audit_run_id: string;
          criteria_item_id: string;
          score: number;
          max_score: number;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_audit_scores"]["Row"]>;
        Relationships: [];
      };
      ranking_audit_evidence: {
        Row: {
          id: string;
          audit_score_id: string;
          source_url: string | null;
          excerpt: string;
          note: string;
          confidence: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ranking_audit_evidence"]["Row"], "id" | "created_at">> & {
          audit_score_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_audit_evidence"]["Row"]>;
        Relationships: [];
      };
      estimate_catalog_items: {
        Row: {
          id: string;
          category: string;
          subcategory: string;
          name: string;
          description: string;
          unit: string;
          unit_price: number;
          unit_price_line_registered: number | null;
          unit_price_hp_managed: number | null;
          order_type: "first_time" | "revision" | "resubmission" | null;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["estimate_catalog_items"]["Row"], "id" | "created_at" | "updated_at">> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimate_catalog_items"]["Row"]>;
        Relationships: [];
      };
      estimate_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["estimate_templates"]["Row"], "id" | "created_at" | "updated_at">> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimate_templates"]["Row"]>;
        Relationships: [];
      };
      estimate_template_items: {
        Row: {
          id: string;
          template_id: string;
          catalog_item_id: string;
          default_quantity: number;
          sort_order: number;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["estimate_template_items"]["Row"], "id">> & {
          template_id: string;
          catalog_item_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimate_template_items"]["Row"]>;
        Relationships: [];
      };
      estimates: {
        Row: {
          id: string;
          store_id: string | null;
          client_name: string;
          client_contact: string;
          title: string;
          status: "draft" | "sent" | "accepted" | "rejected";
          source_template_id: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          notes: string;
          production_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["estimates"]["Row"], "id" | "created_at" | "updated_at">> & {
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimates"]["Row"]>;
        Relationships: [];
      };
      estimate_line_items: {
        Row: {
          id: string;
          estimate_id: string;
          catalog_item_id: string | null;
          category: string;
          name: string;
          description: string;
          unit: string;
          unit_price: number;
          procurement_cost: number;
          discount_amount: number;
          discount_label: string;
          quantity: number;
          amount: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["estimate_line_items"]["Row"], "id" | "created_at">> & {
          estimate_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["estimate_line_items"]["Row"]>;
        Relationships: [];
      };
      chatbot_bot_configs: {
        Row: {
          id: string;
          store_id: string;
          public_bot_id: string;
          status: "draft" | "published" | "archived";
          mode: "choice" | "ai" | "hybrid";
          allowed_domains: string[];
          theme: Record<string, unknown>;
          rate_limit_per_minute: number;
          rate_limit_per_day: number;
          ai_monthly_token_limit: number | null;
          ai_monthly_cost_limit_usd: number | null;
          draft_system_prompt: string;
          published_system_prompt: string;
          prompt_published_at: string | null;
          prompt_published_by: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_bot_configs"]["Row"], "id" | "public_bot_id" | "created_at" | "updated_at">> & {
          store_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_bot_configs"]["Row"]>;
        Relationships: [];
      };
      chatbot_notification_contacts: {
        Row: {
          id: string;
          store_id: string;
          email: string;
          name: string;
          is_primary: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_notification_contacts"]["Row"], "id" | "created_at" | "updated_at">> & {
          store_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_notification_contacts"]["Row"]>;
        Relationships: [];
      };
      chatbot_knowledge_sources: {
        Row: {
          id: string;
          store_id: string;
          source_type: "recruitment_lp" | "manual_url" | "manual_text";
          url: string;
          fetched_content: string;
          fetched_content_hash: string;
          fetched_at: string | null;
          approved_content: string;
          approved_content_hash: string;
          approved_at: string | null;
          approved_by: string | null;
          status: "pending" | "fetched" | "approved" | "rejected" | "stale";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_knowledge_sources"]["Row"], "id" | "created_at" | "updated_at">> & {
          store_id: string;
          source_type: "recruitment_lp" | "manual_url" | "manual_text";
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_knowledge_sources"]["Row"]>;
        Relationships: [];
      };
      chatbot_knowledge_items: {
        Row: {
          id: string;
          store_id: string;
          source_id: string | null;
          item_type:
            | "salary"
            | "holiday"
            | "location"
            | "hours"
            | "benefits"
            | "requirements"
            | "training"
            | "selection_flow"
            | "faq"
            | "other";
          category: string;
          title: string;
          body: string;
          metadata: Record<string, unknown>;
          sort_order: number;
          is_published: boolean;
          published_snapshot: Record<string, unknown> | null;
          published_at: string | null;
          published_by: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_knowledge_items"]["Row"], "id" | "created_at" | "updated_at">> & {
          store_id: string;
          item_type: Database["public"]["Tables"]["chatbot_knowledge_items"]["Row"]["item_type"];
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_knowledge_items"]["Row"]>;
        Relationships: [];
      };
      chatbot_flow_versions: {
        Row: {
          id: string;
          store_id: string;
          version: number;
          draft_json: Record<string, unknown>;
          published_json: Record<string, unknown> | null;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_flow_versions"]["Row"], "id" | "created_at">> & {
          store_id: string;
          version: number;
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_flow_versions"]["Row"]>;
        Relationships: [];
      };
      chatbot_usage_daily: {
        Row: {
          id: string;
          store_id: string;
          date: string;
          chat_message_count: number;
          ai_response_count: number;
          input_tokens: number;
          output_tokens: number;
          estimated_cost_usd: number;
          application_success_count: number;
          application_failure_count: number;
          widget_load_count: number;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_usage_daily"]["Row"], "id" | "updated_at">> & {
          store_id: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_usage_daily"]["Row"]>;
        Relationships: [];
      };
      chatbot_error_logs: {
        Row: {
          id: string;
          store_id: string | null;
          error_code: string;
          error_source: "ai" | "email" | "fetch" | "flow" | "rate_limit" | "other";
          message: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["chatbot_error_logs"]["Row"], "id" | "created_at">> & {
          error_code: string;
          error_source: "ai" | "email" | "fetch" | "flow" | "rate_limit" | "other";
        };
        Update: Partial<Database["public"]["Tables"]["chatbot_error_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      link_diagnosis_to_store: {
        Args: {
          p_salon_name: string;
          p_salon_phone: string;
          p_total_score: number;
          p_rank: string;
          p_category_scores: unknown;
          p_answers: unknown;
          p_completed_at: string;
        };
        Returns: string;
      };
      chatbot_increment_usage: {
        Args: {
          p_store_id: string;
          p_date: string;
          p_chat_message_count?: number;
          p_ai_response_count?: number;
          p_input_tokens?: number;
          p_output_tokens?: number;
          p_estimated_cost_usd?: number;
          p_application_success_count?: number;
          p_application_failure_count?: number;
          p_widget_load_count?: number;
        };
        Returns: undefined;
      };
    };
  };
}
