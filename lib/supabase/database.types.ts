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
    };
  };
}
