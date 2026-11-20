// チャットボットの求人ナレッジ取り込み（HPから生スクレイピングしたテキスト）を、
// 管理者が承認しやすいよう求人情報として整理する。Gemini呼び出しの重複実装を避けるため
// lib/ai/gemini.ts の差し替え境界を再利用する。
//
// 呼び出し元（app/api/chatbot/admin/bots/[storeId]/knowledge-sources/[id]/sync/route.ts）
// 側でも、失敗時は整理前の生テキストにフォールバックする前提のため、ここでは例外を
// 投げっぱなしにせず呼び出し元に委ねる（withRetryはlib/ai/gemini.ts側で完結済み）。
import { getGeminiModel } from "./gemini";

const SYSTEM_INSTRUCTION =
  "あなたは美容室の求人情報を整理するアシスタントです。元のテキストに実際に書かれている内容だけを扱い、" +
  "情報を新たに作り出したり推測で補ったりしないでください。";

function buildPrompt(rawText: string): string {
  return `以下は美容室の求人・採用ページからそのまま抜き出した生のテキストです。ナビゲーションメニュー・フッター・著作権表記など求人情報と関係ない部分を取り除き、給与・勤務時間・休日・福利厚生・応募条件・研修・選考フロー・お店の雰囲気など求職者向けの情報だけを、見出しを付けて読みやすく整理してください。

書かれていない情報を推測して補わないでください。前置きや説明文は付けず、整理した本文のみを出力してください。

---
${rawText}
---`;
}

export async function structureKnowledgeSourceContent(rawText: string): Promise<string> {
  const model = getGeminiModel({ plainText: true, systemInstruction: SYSTEM_INSTRUCTION });
  const result = await model.generateContent(buildPrompt(rawText));
  const text = result.response.text().trim();
  return text || rawText;
}
