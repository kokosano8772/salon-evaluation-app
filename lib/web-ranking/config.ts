// WEBランキング機能の仮仕様（設計書11章の未確定事項）を1箇所に集約する定数。
// 設計書12章「未確定事項は独断で事業要件に昇格させず、設定可能な形または
// 明示的な仮仕様として実装する」に対応。値を変える時はここだけ直せばよい。

// 根拠として保存する抜粋の最大文字数（11章-8: 公開する評価根拠の範囲）。
// 全文は保存しない方針。
export const EVIDENCE_EXCERPT_MAX_CHARS = 300;

// AIに渡すページ本文の上限文字数（lib/ai-checkの8000文字修正と同じ理由で、
// 1ページに全情報が載る一枚ページサイトでも後半が切れないようにする）。
export const AI_MAX_CHARS_PER_PAGE = 8000;
export const AI_MAX_PAGES = 15;

// 「リンク切れ無し」判定でサンプルチェックする内部リンクの最大件数
// （全リンクを検証すると診断1回あたりのリクエスト数・時間が膨らむため）。
export const BROKEN_LINK_SAMPLE_SIZE = 5;

// 診断1回あたりの全体タイムアウト（crawlSiteの90秒 + AI呼び出し等の余裕を見て）。
export const AUDIT_RUN_MAX_DURATION_SECONDS = 120;
