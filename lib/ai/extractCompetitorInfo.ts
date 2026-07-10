// 競合サロンの情報をGemini + Google検索グラウンディングで推定する。
// lib/ai/gemini.ts の差し替え境界を再利用し、Gemini呼び出しを重複実装しない。
//
// Google検索でグラウンディングさせることで、既知のURLを1つ読ませるだけでなく、
// 求人媒体・予約サイトなど複数の公開ページから横断的に情報を拾える。
// ただしGemini 2.5系ではgoogleSearchツールとJSON強制出力(responseMimeType)は
// 併用できないため、プロンプト側でJSON形式を厳密に指示し、レスポンスは
// マークダウンのコードフェンスを剥がしてから緩やかにパースする。

import { getGeminiModel } from "./gemini";
import type { AttractionData, RecruitmentData } from "@/lib/competitor-research/types";

export interface ExtractionResult {
  attraction: Partial<AttractionData>;
  recruitment: Partial<RecruitmentData>;
}

function buildExtractionPrompt(salonName: string, area: string, knownWebsite?: string): string {
  const websiteHint = knownWebsite
    ? `公式サイトと思われるURL: ${knownWebsite}（まずここを確認し、次に求人媒体・予約サイトなど関連する公開ページもGoogle検索で探してください）`
    : "公式サイトのURLは不明です。Google検索でこのサロインの情報を探してください。";

  return `あなたは美容サロンの競合調査アシスタントです。Google検索を使って、以下のサロンの情報を調べてください。

【サロン名】${salonName}
【エリア】${area}
${websiteHint}

価格帯・人気メニュー・キャンペーン・SNS運用状況などの集客に関する情報と、
給与・休日数・教育制度・福利厚生などの求人に関する情報を、
公式サイトやリジョブ・ホットペッパービューティー・Indeedなどの公開ページから探してください。
検索しても見つからない・明確に読み取れない項目は、キーごと省略してください（推測や嘘の値を入れないこと）。

以下のJSON形式のみで回答してください。前置きや説明文、マークダウンのコードブロックは一切付けないでください。
{
  "attraction": {
    "priceRange": "string（例: ¥5,000〜¥10,000）",
    "popularMenus": ["string", "..."],
    "couponCount": number,
    "specialGenre": "string",
    "ageTarget": "string",
    "designTrend": "string",
    "storeImage": "string",
    "hasInstagram": boolean,
    "snsUpdateFrequency": "string",
    "reservationFlow": "string",
    "campaign": "string",
    "strengths": "string",
    "features": "string",
    "seatCount": number,
    "staffCount": number
  },
  "recruitment": {
    "salary": "string",
    "minimumGuarantee": "string",
    "commissionRate": "string",
    "holidayCount": number,
    "paidLeave": boolean,
    "overtime": "string",
    "educationSystem": "string",
    "training": "string",
    "acceptsNewGraduates": boolean,
    "socialInsurance": boolean,
    "benefits": "string",
    "maternityLeave": boolean,
    "workStyle": "string",
    "flexibleHours": boolean,
    "shortHours": boolean,
    "jobDescription": "string",
    "desiredPersonality": "string",
    "recruitmentFeatures": "string"
  }
}
見つからなかった項目はキー自体を省略してください。`;
}

function extractJson(rawText: string): unknown {
  // ```json ... ``` のようなコードフェンスが付く場合があるので剥がす
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1] : rawText;
  return JSON.parse(jsonText.trim());
}

export async function extractCompetitorInfo(
  salonName: string,
  area: string,
  knownWebsite?: string
): Promise<ExtractionResult | null> {
  try {
    const model = getGeminiModel({ useGoogleSearch: true });
    const prompt = buildExtractionPrompt(salonName, area, knownWebsite);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = extractJson(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      attraction: (parsed as Record<string, unknown>).attraction as Partial<AttractionData> ?? {},
      recruitment: (parsed as Record<string, unknown>).recruitment as Partial<RecruitmentData> ?? {},
    };
  } catch (error) {
    console.error("Competitor info extraction failed:", error);
    return null;
  }
}
