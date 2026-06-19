import { CategoryScore, Improvement } from "./types";

const IMPROVEMENT_MAP: Record<string, (score: CategoryScore) => Improvement[]> = {
  product: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "product",
        title: "独自メニューの開発が急務です",
        description:
          "他店と差別化できるシグネチャーメニューを1〜2個作りましょう。「うちにしかない体験」がリピートと紹介を生みます。",
        priority: "high",
        action: "今月中に「看板メニュー」を1つ決め、価格・ストーリー・SNS発信まで設計する",
      });
      improvements.push({
        categoryId: "product",
        title: "物販・ホームケア提案の仕組みを作る",
        description:
          "来店時に必ず1つホームケア商品を提案するルールを設けるだけで客単価は1,000〜2,000円上がります。",
        priority: "high",
        action: "カウンセリングシートに「本日のおすすめ商品」欄を追加する",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "product",
        title: "技術力のブランディングを強化する",
        description:
          "持っている技術をSNSやHPで「見える化」できていますか？コンテスト参加・資格取得のストーリーを発信しましょう。",
        priority: "medium",
        action: "スタッフの専門技術・得意分野をInstagramのハイライトで紹介する",
      });
    } else {
      improvements.push({
        categoryId: "product",
        title: "商品力はトップクラス。次は外部への発信を",
        description:
          "高い商品力を持っています。この強みを業界メディアやセミナー登壇で外部発信することで、さらなるブランド向上を狙えます。",
        priority: "low",
        action: "業界誌への寄稿・セミナー登壇の機会を年1回以上作る",
      });
    }
    return improvements;
  },

  customer: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "customer",
        title: "再来率向上が最優先課題です",
        description:
          "新規集客より既存顧客の維持コストは1/5。まず「なぜ来なくなるのか」をヒアリングして原因を特定しましょう。",
        priority: "high",
        action: "失客顧客10名にLINEでアンケートを送り、離れた理由を把握する",
      });
      improvements.push({
        categoryId: "customer",
        title: "LINE公式アカウントでフォローアップを自動化",
        description:
          "来店から3週間後に自動メッセージを送ることで、再来率が平均15〜20%改善する事例があります。",
        priority: "high",
        action: "LINE公式アカウントの自動メッセージ機能を設定する（来店3週間後・1ヵ月後）",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "customer",
        title: "紹介制度を仕組み化しましょう",
        description:
          "口コミ・紹介顧客はLTV（顧客生涯価値）が高い優良客になりやすい。紹介した顧客・された顧客両方に特典を作りましょう。",
        priority: "medium",
        action: "「お友達紹介カード」を作成し、次回施術時に手渡しするフローを作る",
      });
    } else {
      improvements.push({
        categoryId: "customer",
        title: "高い顧客支持力。VIP顧客プログラムを検討",
        description:
          "優良顧客をさらに囲い込むVIPメンバーシップ制度の導入を検討しましょう。年間パスや優先予約特典が効果的です。",
        priority: "low",
        action: "年間来店5回以上の顧客をVIP認定し、限定特典を提供するプログラムを設計する",
      });
    }
    return improvements;
  },

  brand: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "brand",
        title: "Googleビジネスプロフィールの完全最適化が最優先",
        description:
          "Googleマップ検索で上位表示されることで、月間20〜50件の新規問い合わせが生まれます。写真・投稿・口コミ返信を徹底しましょう。",
        priority: "high",
        action: "今週中にGBPの写真を20枚以上追加し、週1回の投稿ルーティンを設定する",
      });
      improvements.push({
        categoryId: "brand",
        title: "Instagram運用を今すぐ開始",
        description:
          "美容室の新規集客でInstagramは依然として最強ツール。週3投稿＋リール月4本を3ヵ月続けることで効果が出始めます。",
        priority: "high",
        action: "投稿テンプレートを5種類作成し、1ヵ月分の投稿カレンダーを作る",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "brand",
        title: "ホームページのSEO強化でオーガニック集客を",
        description:
          "「地域名＋美容室」での検索上位を狙うことで、ホットペッパー依存から脱却できます。ブログ投稿が特に有効です。",
        priority: "medium",
        action: "月2本のブログ記事（ヘアスタイル紹介・ケア方法）を書き始める",
      });
    } else {
      improvements.push({
        categoryId: "brand",
        title: "ブランド力は高い。次はメディア露出を狙う",
        description:
          "地域メディアへのPRや雑誌掲載を狙うことで、さらなる認知拡大が可能です。プレスリリースの発行を検討しましょう。",
        priority: "low",
        action: "地域のフリーペーパーや美容専門誌にPR記事の掲載を打診する",
      });
    }
    return improvements;
  },

  recruitment: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "recruitment",
        title: "採用ブランディングの構築が急務",
        description:
          "「なぜここで働くのか」を伝えるコンテンツがなければ応募は来ません。スタッフのリアルな声・職場環境を発信しましょう。",
        priority: "high",
        action: "スタッフインタビュー動画を撮影し、Instagram・求人ページに掲載する",
      });
      improvements.push({
        categoryId: "recruitment",
        title: "LINE採用を導入する",
        description:
          "フォームよりLINEの方が応募率が3〜5倍高い傾向があります。「LINE公式で気軽に相談」の導線を作りましょう。",
        priority: "high",
        action: "LINE公式アカウントに採用専用の自動返信・FAQ機能を設定する",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "recruitment",
        title: "見学体験の質を向上させる",
        description:
          "見学から採用までの転換率を高めるために、見学当日のストーリー設計を見直しましょう。体験施術・ランチ同行が効果的です。",
        priority: "medium",
        action: "見学時の流れをマニュアル化し、全スタッフが案内できるようにする",
      });
    } else {
      improvements.push({
        categoryId: "recruitment",
        title: "採用力は高い。次は定着率のさらなる向上へ",
        description:
          "採用できている今こそ、入社後1年のオンボーディングプログラムを充実させるチャンスです。",
        priority: "low",
        action: "入社3・6・12ヵ月の1on1面談と目標設定の制度を整備する",
      });
    }
    return improvements;
  },

  organization: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "organization",
        title: "オーナー依存からの脱却が最優先",
        description:
          "あなたがいないと動かない組織はリスクです。まず「自分がやっている業務を書き出す」ことから始めましょう。",
        priority: "high",
        action: "今週中に自分の1日の業務をリスト化し、「誰かに渡せる業務」を3つ特定する",
      });
      improvements.push({
        categoryId: "organization",
        title: "業務マニュアルの作成を今すぐ始める",
        description:
          "完璧を目指さず、まず「接客の基本フロー」1つをA4・1枚でまとめるところから。積み重ねが組織を変えます。",
        priority: "high",
        action: "「お出迎えから施術開始まで」の接客フローをマニュアル化する",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "organization",
        title: "次世代リーダーの育成プランを作る",
        description:
          "店長候補を1名特定し、6ヵ月の育成プランを作りましょう。「任せる勇気」がオーナーの時間を作ります。",
        priority: "medium",
        action: "店長候補1名を選定し、月次1on1＋権限委譲の計画を作成する",
      });
    } else {
      improvements.push({
        categoryId: "organization",
        title: "組織力は高い。多店舗展開の検討を",
        description:
          "現在の組織体制で2店舗目の運営は十分可能です。出店戦略・資金計画の検討を始めましょう。",
        priority: "low",
        action: "3年以内の多店舗展開を前提に、現組織の複製可能性を評価する",
      });
    }
    return improvements;
  },

  future: (cs) => {
    const improvements: Improvement[] = [];
    const pct = cs.percentage;

    if (pct < 50) {
      improvements.push({
        categoryId: "future",
        title: "AI検索時代への対応を今すぐ始める",
        description:
          "ChatGPTやGeminiで「地域名＋美容室」と検索されたときに上位表示されるよう、Webコンテンツの充実が必要です。",
        priority: "high",
        action: "ホームページにFAQ形式のコンテンツを5ページ追加する",
      });
      improvements.push({
        categoryId: "future",
        title: "顧客データのデジタル化を今すぐ",
        description:
          "紙カルテは宝の持ち腐れ。無料から始められるサロン管理システム（Salon Board等）でデジタル化しましょう。",
        priority: "high",
        action: "無料トライアルのサロン管理システムを1つ導入テストする",
      });
    } else if (pct < 75) {
      improvements.push({
        categoryId: "future",
        title: "LINE公式のセグメント配信を活用する",
        description:
          "全員に同じメッセージではなく、「カラー希望顧客」「ヘッドスパ希望顧客」など属性別配信で反応率が大幅に上がります。",
        priority: "medium",
        action: "LINE公式でタグ機能を使い、顧客を3つのセグメントに分類する",
      });
    } else {
      improvements.push({
        categoryId: "future",
        title: "将来性は高い。デジタル先進事例の発信を",
        description:
          "貴社のデジタル活用事例を業界に発信することで、採用ブランディングとメディア露出が同時に強化されます。",
        priority: "low",
        action: "美容業界の勉強会やオンラインセミナーでデジタル活用事例を登壇発表する",
      });
    }
    return improvements;
  },
};

export function generateImprovements(categoryScores: CategoryScore[]): Improvement[] {
  const allImprovements: Improvement[] = [];

  categoryScores.forEach((cs) => {
    const generator = IMPROVEMENT_MAP[cs.categoryId];
    if (generator) {
      allImprovements.push(...generator(cs));
    }
  });

  return allImprovements.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}
