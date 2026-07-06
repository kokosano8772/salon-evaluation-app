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
          opened_year: number;
          store_count: number;
          seat_count: number;
          business_hours: string;
          business_days: string;
          staff_count: number;
          target_customer: string;
          average_unit_price: number;
          trade_area: string;
          store_format: string;
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
        Update: Partial<Pick<Database["public"]["Tables"]["diagnosis_results"]["Row"], "status">>;
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
