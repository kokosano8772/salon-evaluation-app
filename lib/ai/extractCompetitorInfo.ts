// 競合のウェブサイト本文からGeminiで比較項目を推定する。
// lib/ai/gemini.ts の差し替え境界を再利用し、Gemini呼び出しを重複実装しない。

import { getGeminiModel } from "./gemini";
import type { AttractionData, RecruitmentData } from "@/lib/competitor-research/types";

export interface ExtractionResult {
  attraction: Partial<AttractionData>;
  recruitment: Partial<RecruitmentData>;
}

function buildExtractionPrompt(salonName: string, websiteText: string): string {
  return `あなたは以下のウェブサイトのテキストから、美容サロン「${salonName}」の情報を抽出するアシスタントです。
明確に読み取れる情報だけをJSONで返してください。書かれていない・推測でしか分からない項目はキーごと省略してください（空文字やnull、嘘の値を入れないこと）。

【ウェブサイトのテキスト】
${websiteText}

【出力形式】以下のJSON形式のみで出力してください。説明文やmarkdownのコードブロックは付けないでください。
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
読み取れなかった項目はキー自体を省略してください。`;
}

export async function extractCompetitorInfo(
  salonName: string,
  websiteText: string
): Promise<ExtractionResult | null> {
  try {
    const model = getGeminiModel();
    const prompt = buildExtractionPrompt(salonName, websiteText);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
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
