import { Category, DiagnosisAnswers, DiagnosisResult, CategoryScore, Rank, RankInfo } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "product",
    name: "商品力",
    nameEn: "Product Power",
    maxScore: 20,
    icon: "Scissors",
    color: "#C4788A",
    description: "メニューの独自性・技術力・客単価など、サロンの商品そのものの価値",
    questions: [
      {
        id: "product_uniqueness",
        categoryId: "product",
        label: "メニューの独自性",
        maxScore: 5,
        hint: "他のサロンにはない「うちならでは」のメニューがあるか",
        options: ["なし", "わずかにある", "いくつかある", "多数ある", "業界内でも珍しい", "完全にオリジナル"],
        optionDescriptions: [
          "他のサロンと全く同じようなメニューしかない",
          "少し工夫はしているが、特別なものはほぼない",
          "オリジナルメニューが2〜3種類ある",
          "独自のこだわりメニューが5種類以上ある",
          "同じエリアでは他に真似できないメニューがある",
          "完全オリジナルで、雑誌や業界に取り上げられたことがある",
        ],
      },
      {
        id: "product_skill",
        categoryId: "product",
        label: "技術力",
        maxScore: 5,
        hint: "スタッフ全体の技術レベル。お客様の満足度・仕上がりで判断して",
        options: ["要改善", "標準以下", "業界標準", "標準以上", "高水準", "トップクラス"],
        optionDescriptions: [
          "仕上がりへの不満やクレームが多い",
          "近隣サロンと比べて技術に自信がない",
          "普通のサロンと同じくらいの技術力",
          "お客様からよく褒められる・リピートされる",
          "コンテスト入賞や有名店での修行経験がある",
          "業界誌への掲載・講師活動・著名人担当などの実績がある",
        ],
      },
      {
        id: "product_unit_price",
        categoryId: "product",
        label: "客単価",
        maxScore: 5,
        hint: "お客様1人あたりの平均お会計金額",
        options: ["5,000円未満", "5,000〜7,000円", "7,000〜9,000円", "9,000〜12,000円", "12,000〜15,000円", "15,000円以上"],
        optionDescriptions: [
          "カット・シャンプーのみなど最低限のメニューが中心",
          "カット＋簡単なスタイリングが多い",
          "カット＋カラーが平均的",
          "カット＋カラー＋トリートメントなど複数メニューの利用が多い",
          "フルカラー・パーマ・トリートメントのセット利用が多い",
          "高単価メニューやVIPコースが中心",
        ],
      },
      {
        id: "product_proposal",
        categoryId: "product",
        label: "商品提案力",
        maxScore: 5,
        hint: "シャンプーなどの物販や、追加メニューの提案をどれだけしているか",
        options: ["ほぼしていない", "たまにする", "意識してしている", "仕組みになっている", "高い成果あり", "業界トップレベル"],
        optionDescriptions: [
          "店販比率2%未満 / とても低い。ホームケア商品の提案をほとんどしていない",
          "店販比率2〜5% / 低い。気が向いたときや聞かれたときだけ提案する",
          "店販比率5〜10% / 一般的な平均。毎回意識して提案できている",
          "店販比率10〜15% / 優秀。カルテや手順書をもとに必ず提案する流れができている",
          "店販比率15〜20% / 非常に優秀。物販の成果が数字にしっかり出ている",
          "店販比率20%以上 / トップクラスのサロン。提案の仕組みが完成し業界でも飛び抜けた成果",
        ],
      },
    ],
  },
  {
    id: "customer",
    name: "顧客支持力",
    nameEn: "Customer Loyalty",
    maxScore: 20,
    icon: "Heart",
    color: "#7C9EB5",
    description: "顧客からの支持・再来率・口コミなど、顧客との信頼関係の強さ",
    questions: [
      {
        id: "customer_new_ratio",
        categoryId: "customer",
        label: "新規比率",
        maxScore: 4,
        hint: "1ヶ月の来店者のうち、初めて来るお客様の割合",
        options: ["ほぼ新規ばかり", "新規が多め（40%超）", "バランスが取れている（20〜40%）", "リピーター中心（10〜20%）", "ほぼ常連のみ（10%未満）"],
        scores: [0, 2, 4, 3, 1],
        optionDescriptions: [
          "リピーターがほとんどいない。集客はできているが定着していない状態",
          "まだ常連が育っていない段階。新規への依存度が高い",
          "新規もリピーターも両方いる。バランスの取れた状態",
          "常連が多く安定している。信頼されているサロンの証",
          "ほぼ全員が常連。新規がほとんど入っていない状態",
        ],
      },
      {
        id: "customer_return_rate",
        categoryId: "customer",
        label: "再来率",
        maxScore: 4,
        hint: "初めて来たお客様が、2回目も来てくれる割合",
        options: ["0〜20%", "21〜35%", "36〜50%", "51〜60%", "61%以上"],
        optionDescriptions: [
          "ご新規客リピート率0〜20% / 2回目のご来店されるお客様が少ない",
          "ご新規客リピート率21〜35% / リピート率が低く、常連がなかなか育たない",
          "ご新規客リピート率36〜50% / ある程度リピートはあるが、まだ改善の余地がある",
          "ご新規客リピート率51〜60% / 常連客が多く、口コミや紹介も定期的にある",
          "ご新規客リピート率61%以上 / 高い再来率・指名率で、既存顧客からの紹介が主な集客になっている",
        ],
      },
      {
        id: "customer_designation_rate",
        categoryId: "customer",
        label: "指名率",
        maxScore: 4,
        hint: "「○○さんにお願いしたい」と担当者を指名して来店するお客様の割合",
        options: ["20%未満", "20〜40%", "40〜60%", "60〜75%", "75%以上"],
        optionDescriptions: [
          "担当者を指名してくるお客様がほとんどいない",
          "指名はあるが、担当なしのフリー客が多い状態",
          "半数近くが指名で来店している（普通の水準）",
          "6〜7割が指名来店（優秀な水準）",
          "ほとんどのお客様が担当者を指名している（トップ水準）",
        ],
      },
      {
        id: "customer_referral_rate",
        categoryId: "customer",
        label: "紹介率",
        maxScore: 4,
        hint: "常連のお客様が「友人・知人を連れてきてくれる」割合",
        options: ["ほぼなし", "5%未満", "5〜10%", "10〜20%", "20%以上"],
        optionDescriptions: [
          "お客様からの紹介で新規がほとんど来ない",
          "たまに紹介してもらえる程度（月1〜2人）",
          "月に数人は紹介経由の新規がいる",
          "紹介が主要な集客になっている（月5〜10人以上）",
          "新規の5人に1人以上が紹介。口コミの強さが際立つ状態",
        ],
      },
      {
        id: "customer_review",
        categoryId: "customer",
        label: "口コミ・評価",
        maxScore: 4,
        hint: "GoogleマップやホットペッパーでのサロンのレビューやSNSでの評判",
        options: ["3.0未満またはなし", "3.0〜3.5", "3.5〜4.0", "4.0〜4.5（50件以上）", "4.5以上（100件以上）"],
        optionDescriptions: [
          "Googleや予約サイトの口コミがない、または低評価が多い",
          "口コミはあるが評価が低め。改善が必要な状態",
          "普通レベルの評価。まずまずの状態",
          "高評価かつ口コミ件数も多い。信頼性が高い",
          "非常に高い評価と豊富な口コミ数。集客力がとても強い",
        ],
      },
    ],
  },
  {
    id: "brand",
    name: "ブランド力",
    nameEn: "Brand Power",
    maxScore: 15,
    icon: "Star",
    color: "#9B8DBF",
    description: "Googleプロフィール・HP・SNSなど、オンラインでの集客力と認知度",
    questions: [
      {
        id: "brand_google",
        categoryId: "brand",
        label: "Googleマップの情報",
        maxScore: 5,
        hint: "「近くの美容院」でGoogle検索したとき表示されるお店の情報ページのこと",
        options: ["登録していない", "登録だけしている", "基本情報は入力済み", "写真・投稿もしている", "しっかり運用している", "完璧に運用中"],
        optionDescriptions: [
          "Googleマップで自分のサロンが表示されない、または未登録",
          "Googleマップには出てくるが、情報がほぼ空のまま",
          "住所・電話番号・営業時間は入力してある",
          "写真をアップして定期的に投稿もしている",
          "口コミへの返信・写真・最新情報など全て揃っている",
          "毎週投稿・口コミ管理・予約連携も完璧に行っている",
        ],
      },
      {
        id: "brand_website",
        categoryId: "brand",
        label: "ホームページ",
        maxScore: 5,
        hint: "サロン専用のウェブサイト。ホットペッパーとは別の、自分のお店のサイト",
        options: ["ない", "無料サービスのみ", "あるが古い", "専用サイトあり", "定期的に更新している", "予約が月10件以上来る"],
        optionDescriptions: [
          "サロン専用のホームページが全くない",
          "ペライチやホットペッパーページのみ（独自サイトなし）",
          "ホームページはあるが何年も更新していない",
          "○○salon.comのような専用URLのサイトがある",
          "月1回以上更新していて、Google検索から人が来ている",
          "ホームページ経由で月10件以上の予約や問い合わせが来ている",
        ],
      },
      {
        id: "brand_sns",
        categoryId: "brand",
        label: "公式SNS（個人ではなく会社で運営しているもの）",
        maxScore: 5,
        hint: "InstagramやTikTokでのサロンの発信状況とフォロワー数",
        options: ["アカウントなし", "アカウントのみ", "たまに投稿", "週2〜3回投稿", "毎日投稿・1万フォロワー以上", "インフルエンサー級"],
        optionDescriptions: [
          "InstagramなどSNSのアカウントが全くない",
          "アカウントはあるが投稿をほとんどしていない",
          "月に数回投稿している程度",
          "定期的に投稿していて、フォロワーも少しずつ増えている",
          "毎日発信して1万人以上にフォローされている",
          "3万フォロワー以上・SNSからの集客が主力になっている",
        ],
      },
    ],
  },
  {
    id: "recruitment",
    name: "採用力",
    nameEn: "Recruitment",
    maxScore: 16,
    icon: "Users",
    color: "#6BAB8A",
    description: "求人・見学・採用定着まで、優秀な人材を引き寄せ育てる力",
    questions: [
      {
        id: "recruitment_job_page",
        categoryId: "recruitment",
        label: "求人情報の充実度",
        maxScore: 4,
        hint: "スタッフ募集の情報をどこに・どれだけ詳しく載せているか",
        options: [
          "ほぼなし",
          "最低限の情報のみ",
          "採用専門のホームページがあり写真・雰囲気も載せている",
          "採用サイト・Instagram・Indeedなどを多方面で運用している",
          "多方面の採用導線＋SNS広告など採用広告にも注力している",
        ],
        optionDescriptions: [
          "ハローワークなどに最低限の情報があるだけ、またはない",
          "無料もしくは有料求人サイトに給与と仕事内容だけ載せている",
          "スタッフ紹介・職場の雰囲気・写真も掲載されている",
          "採用専用ページや動画があり、応募したくなる内容になっている",
          "採用導線が多方面にあり、SNS広告も活用。定期的・継続的な採用活動を続けている",
        ],
      },
      {
        id: "recruitment_funnel",
        categoryId: "recruitment",
        label: "応募のしやすさ",
        maxScore: 3,
        hint: "求職者がどこから応募できるか。窓口が多いほど応募が増えやすい",
        options: ["応募窓口がない", "求人サイトのみ", "SNSからも応募できる", "専用LINEなどから多方面から応募できる方法がある"],
        optionDescriptions: [
          "求人情報がどこにも出ていない、または応募方法が不明",
          "リジョブ・美プロ等の求人サイトにだけ掲載している",
          "InstagramのプロフィールにDM問い合わせの案内がある",
          "LINE・SNS・求人サイトなど複数の方法から応募できる",
        ],
      },
      {
        id: "recruitment_visits",
        categoryId: "recruitment",
        label: "見学に来る人数（月間）",
        maxScore: 3,
        hint: "「働く前に見てみたい」と見学希望で来る人が月に何人いるか",
        options: ["ほぼゼロ", "月1〜2人", "月3〜5人", "月6人以上"],
        optionDescriptions: [
          "サロン見学の希望者がほとんど来ない（年数人以下）",
          "月に1〜2人見学に来てくれる",
          "コンスタントに月3〜5人が見学に来る",
          "常に複数の見学希望者がいる状態",
        ],
      },
      {
        id: "recruitment_applications",
        categoryId: "recruitment",
        label: "応募数（月間）",
        maxScore: 3,
        hint: "求人を出したとき、1ヶ月に何人から応募があるか",
        options: ["ほぼゼロ", "月1〜2件", "月3〜5件", "月6件以上"],
        optionDescriptions: [
          "求人を出してもほとんど応募が来ない",
          "月に1〜2件の応募がある",
          "月3〜5件の応募がある（平均的な水準）",
          "常に複数の応募がある人気サロンの状態",
        ],
      },
      {
        id: "recruitment_retention",
        categoryId: "recruitment",
        label: "スタッフの定着率",
        maxScore: 3,
        hint: "採用したスタッフが1年後もまだ働いている割合",
        options: ["50%未満", "50〜70%", "70〜85%", "85%以上"],
        optionDescriptions: [
          "採用した2人に1人以上が1年以内に辞めてしまう",
          "採用した10人のうち5〜7人が1年後も働いている",
          "採用した10人のうち7〜8人が1年後も働いている（良い水準）",
          "採用した10人のうち9人近くが1年後も働いている（とても高い）",
        ],
      },
    ],
  },
  {
    id: "organization",
    name: "組織力",
    nameEn: "Organization",
    maxScore: 16,
    icon: "Building2",
    color: "#E08B6B",
    description: "店長育成・マニュアル・教育制度など、組織として成長できる仕組み",
    questions: [
      {
        id: "org_manager_development",
        categoryId: "organization",
        label: "次の店長を育てているか",
        maxScore: 3,
        hint: "将来サロンを任せられるリーダーを育てる取り組みがあるか",
        options: ["取り組みなし", "個別に教えているだけ", "育成の仕組みがある", "店長候補が複数いる"],
        optionDescriptions: [
          "次の店長を育てる取り組みを何もしていない",
          "見込みのあるスタッフに個人的に教えている",
          "店長になるための手順や学ぶ内容が決まっている",
          "「この人なら任せられる」という人が2人以上いる",
        ],
      },
      {
        id: "org_manual",
        categoryId: "organization",
        label: "業務マニュアルの整備",
        maxScore: 3,
        hint: "仕事のやり方や接客の手順が文書やデータで残っているか",
        options: ["なし", "口頭で伝えるだけ", "一部は文書がある", "全て整備・更新している"],
        optionDescriptions: [
          "業務のやり方は全て口頭で教えており、何も文書化されていない",
          "教える人によってやり方が違う。全て口で伝えている",
          "開閉店の手順など、一部だけ文書がある",
          "全ての業務手順が文書化されており、定期的に更新している",
        ],
      },
      {
        id: "org_education",
        categoryId: "organization",
        label: "スタッフへの教育制度",
        maxScore: 4,
        hint: "新人や若手スタッフを育てるための仕組みがあるか",
        options: ["特になし", "見て覚えてもらう", "定期的な勉強会あり", "カリキュラムが整っている", "動画で技術が学べるようになっている"],
        optionDescriptions: [
          "教育は特になく、自分で覚えてもらうスタイル",
          "先輩スタッフのやり方を見て自然に学ぶスタイル",
          "月1回以上の技術練習や勉強会を開いている",
          "入社から独り立ちまでの学ぶ手順が完全に決まっている",
          "カット・カラー・パーマなど基本技術の動画プロセスが充実しており、いつでも学べる環境がある",
        ],
      },
      {
        id: "org_executive",
        categoryId: "organization",
        label: "オーナー不在でも回るか",
        maxScore: 3,
        hint: "自分（オーナー）がいなくてもサロンが正常に運営できるか",
        options: ["自分がいないと無理", "代わりが1人いる", "リーダー役が複数いる", "自分なしで完全に回る"],
        optionDescriptions: [
          "自分（オーナー）がいないとサロンが回らない状態",
          "オーナーの代わりをある程度できる人が1人いる",
          "リーダー役が複数人いて、チームで動き始めている",
          "オーナーが不在でもスタッフだけで問題なく運営できる",
        ],
      },
      {
        id: "org_role_division",
        categoryId: "organization",
        label: "スタッフの役割分担",
        maxScore: 3,
        hint: "「誰が何をするか」がスタッフ全員に明確に決まっているか",
        options: ["なんとなくやっている", "ある程度は決まっている", "全員が明確に理解している", "目標とも連動している"],
        optionDescriptions: [
          "誰が何をするか決まっておらず、なんとなくやっている",
          "大まかな役割はあるが、境界があいまいな部分がある",
          "誰が何を担当するか明確に決まっており、全員が理解している",
          "各自の役割に数値目標が設定されており、管理されている",
        ],
      },
    ],
  },
  {
    id: "future",
    name: "将来性",
    nameEn: "Future Potential",
    maxScore: 15,
    icon: "TrendingUp",
    color: "#5B9BD5",
    description: "AI・検索・データ活用など、これからの時代に対応する成長投資",
    questions: [
      {
        id: "future_ai_search",
        categoryId: "future",
        label: "AIへの対応（AI検索対策）",
        maxScore: 3,
        hint: "ChatGPTなどのAIに「近くのおすすめサロン」として表示されるための準備",
        options: ["知らなかった", "知ってはいる", "少し始めている", "しっかり対応中"],
        optionDescriptions: [
          "ChatGPTなどで「近くのサロン」が検索されることを知らなかった",
          "AIで検索されることは知っているが、特に何もしていない",
          "サイトやプロフィール文をわかりやすく整理し始めた",
          "AI検索で上位表示されるよう専門家に相談・対策をしている",
        ],
      },
      {
        id: "future_google_seo",
        categoryId: "future",
        label: "Google検索への対策",
        maxScore: 3,
        hint: "「地域名＋美容院」でGoogleで検索したとき、自分のサロンが上に出てくるか",
        options: ["全くできていない", "Googleマップだけ登録", "定期的に更新している", "検索からお客様が来ている"],
        optionDescriptions: [
          "「近くの美容院」などで検索しても自分のサロンが出てこない",
          "Googleマップには登録しているが、特に対策はしていない",
          "Googleマップやサイトを定期的に更新して上位を目指している",
          "Google検索経由で月10件以上の予約や問い合わせが来ている",
        ],
      },
      {
        id: "future_customer_data",
        categoryId: "future",
        label: "お客様情報の管理・活用",
        maxScore: 3,
        hint: "来店履歴・施術内容・好みなどのお客様データをどう管理しているか",
        options: ["紙のカルテのみ", "表計算ソフト（Excel等）", "専用アプリ・システムあり", "データを経営に活かしている"],
        optionDescriptions: [
          "お客様の情報は全て紙に書いて保管している",
          "エクセルや表計算でお客様情報を管理している",
          "サロンボード・Limeなどの専用ソフトを使っている",
          "来店頻度や施術内容を分析してキャンペーンや提案に活かしている",
        ],
      },
      {
        id: "future_line",
        categoryId: "future",
        label: "LINE公式アカウントの活用",
        maxScore: 3,
        hint: "お客様へのお知らせやキャンペーン告知をLINEで行っているか",
        options: ["持っていない", "あるが使っていない", "予約リマインドに使っている", "キャンペーン配信に活用中"],
        optionDescriptions: [
          "LINE公式アカウント（お店専用のLINE）を持っていない",
          "LINE公式アカウントはあるが、ほとんど使っていない",
          "予約の前日リマインドや来店後のお礼メッセージを送っている",
          "お客様をグループ分けしてキャンペーン情報などを配信している",
        ],
      },
      {
        id: "future_new_initiatives",
        categoryId: "future",
        label: "新しいことへの挑戦",
        maxScore: 3,
        hint: "新しいメニュー・ツール・集客方法などを積極的に試しているか",
        options: ["ほぼ変化なし", "年に1回くらい試す", "3ヶ月に1回は試す", "毎月新しいことを試す"],
        optionDescriptions: [
          "ここ数年、やり方や取り組みがほとんど変わっていない",
          "年に1回くらい新しいことを試してみる",
          "3ヶ月に1回は新しい取り組みや仕掛けを試している",
          "毎月新しい取り組みを試して効果を確認しながら改善している",
        ],
      },
    ],
  },
];

export const RANK_INFO: Record<string, RankInfo> = {
  S: {
    rank: "S",
    label: "Sランク",
    description: "業界トップクラス。このまま拡大戦略を。",
    color: "#C4788A",
    bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
    textColor: "text-rose-600",
    borderColor: "border-rose-300",
    minScore: 90,
    maxScore: 100,
  },
  A: {
    rank: "A",
    label: "Aランク",
    description: "高水準の経営力。あと少しで業界最高峰に。",
    color: "#7C9EB5",
    bgColor: "bg-gradient-to-br from-blue-50 to-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-400",
    minScore: 80,
    maxScore: 89,
  },
  B: {
    rank: "B",
    label: "Bランク",
    description: "平均以上の実力。重点改善で大きく伸びる。",
    color: "#9B8DBF",
    bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-400",
    minScore: 65,
    maxScore: 79,
  },
  C: {
    rank: "C",
    label: "Cランク",
    description: "基盤はある。仕組み化で安定した経営へ。",
    color: "#6BAB8A",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-400",
    minScore: 50,
    maxScore: 64,
  },
  D: {
    rank: "D",
    label: "Dランク",
    description: "今すぐ改革が必要。ここが出発点。",
    color: "#E08B6B",
    bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-400",
    minScore: 0,
    maxScore: 49,
  },
};

export function calculateRank(score: number): Rank {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function calculateCategoryScore(
  category: Category,
  answers: DiagnosisAnswers
): CategoryScore {
  const score = category.questions.reduce((sum, q) => {
    const answerIndex = answers[q.id] ?? 0;
    const questionScore = q.scores ? (q.scores[answerIndex] ?? 0) : answerIndex;
    return sum + questionScore;
  }, 0);
  return {
    categoryId: category.id,
    name: category.name,
    nameEn: category.nameEn,
    score,
    maxScore: category.maxScore,
    percentage: Math.round((score / category.maxScore) * 100),
    color: category.color,
  };
}

export function calculateResult(answers: DiagnosisAnswers): DiagnosisResult {
  const categoryScores = CATEGORIES.map((cat) =>
    calculateCategoryScore(cat, answers)
  );
  const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
  const rank = calculateRank(totalScore);

  return {
    totalScore,
    rank,
    categoryScores,
    answers,
    completedAt: new Date().toISOString(),
  };
}

export function getAllQuestions() {
  return CATEGORIES.flatMap((cat) => cat.questions);
}

export function getTotalQuestions() {
  return getAllQuestions().length;
}
