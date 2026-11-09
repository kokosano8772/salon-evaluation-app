// 選択式フローの検証。
// 1. 公開前検証（基本設計書5章）：開始ノードが一つ、参照切れなし、無限ループ禁止、
//    終了導線あり。publishルートからのみ呼ぶ（下書き保存時は未完成でもよいため）。
// 2. 応募導線フィールドの検証（URLスキーム・電話番号形式）：下書き保存・公開の
//    どちらでも必ず通す。不正なスキーム（javascript:等）を含むURLが一度でも
//    DBに保存されることを防ぐため、こちらは「保存時」から強制する。
//
// P1時点ではcontact_formノードのみだったが、サロンによって応募導線が
// メール／LINE／外部フォーム／電話と異なるため、apply_actionノード
// （method別の終端アクション）に一本化した。既存のchatbot_flow_versionsには
// 実データが無いことを確認済みのため、互換レイヤーは設けていない。
//
// フローJSONの形:
// { nodes: [
//     { id, type: "start", nextNodeId },
//     { id, type: "choice", text, options: [{ label, nextNodeId }] },
//     { id, type: "text_input", text, nextNodeId },
//     { id, type: "notice", text, nextNodeId },
//     { id, type: "apply_action", text, method: "email"|"line"|"external_form"|"phone",
//       fields?: { askPhone?, askDesiredPosition?, askEmploymentType? }, // method="email"のみ
//       lineUrl?, externalFormUrl?, phoneNumber? },
//     { id, type: "end" },
// ] }

export const APPLY_ACTION_METHODS = ["email", "line", "external_form", "phone"] as const;
export type ApplyActionMethod = (typeof APPLY_ACTION_METHODS)[number];

export interface FlowNode {
  id: string;
  type: "start" | "choice" | "text_input" | "notice" | "apply_action" | "end";
  text?: string;
  nextNodeId?: string;
  options?: { label: string; nextNodeId: string }[];
  method?: ApplyActionMethod;
  fields?: {
    askPhone?: boolean;
    askDesiredPosition?: boolean;
    askEmploymentType?: boolean;
  };
  lineUrl?: string;
  externalFormUrl?: string;
  phoneNumber?: string;
}

export interface FlowValidationResult {
  ok: boolean;
  errors: string[];
}

function isFlowNode(value: unknown): value is FlowNode {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.type === "string";
}

// http/https以外（javascript:, data:, file:等）を許可しない。リンク遷移先として
// そのままクリック可能な<a href>に使われるため、XSS相当のリスクを事前に排除する。
export function isSafeExternalUrl(value: string): boolean {
  if (!value || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// tel:リンクに使うため、数字・+・-・スペース・括弧のみを許可する簡易チェック。
export function isSafePhoneNumber(value: string): boolean {
  if (!value || value.length > 20) return false;
  return /^[0-9+\-() ]+$/.test(value.trim()) && /\d/.test(value);
}

// 下書き保存・公開どちらでも必ず通す、応募導線フィールドの安全性チェック。
// 構造（開始ノードの数・参照切れ等）は問わない——編集途中の下書きでは
// まだ整合していなくてよいため。
export function validateApplyActionFields(flow: Record<string, unknown>): FlowValidationResult {
  const errors: string[] = [];
  const rawNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const nodes = rawNodes.filter(isFlowNode);

  for (const node of nodes) {
    if (node.type !== "apply_action") continue;
    if (!node.method || !APPLY_ACTION_METHODS.includes(node.method)) {
      errors.push(`ノード「${node.id}」の応募導線の種類が不正です`);
      continue;
    }
    if (node.method === "line") {
      if (!node.lineUrl || !isSafeExternalUrl(node.lineUrl)) {
        errors.push(`ノード「${node.id}」のLINE URLが不正です（https/httpのURLのみ使用できます）`);
      }
    }
    if (node.method === "external_form") {
      if (!node.externalFormUrl || !isSafeExternalUrl(node.externalFormUrl)) {
        errors.push(`ノード「${node.id}」の外部フォームURLが不正です（https/httpのURLのみ使用できます）`);
      }
    }
    if (node.method === "phone") {
      if (!node.phoneNumber || !isSafePhoneNumber(node.phoneNumber)) {
        errors.push(`ノード「${node.id}」の電話番号が不正です`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateFlow(flow: Record<string, unknown>): FlowValidationResult {
  const errors: string[] = [];
  const rawNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const nodes = rawNodes.filter(isFlowNode);
  if (nodes.length !== rawNodes.length) {
    errors.push("形式が不正なノードが含まれています");
  }
  if (nodes.length === 0) {
    return { ok: false, errors: ["ノードが1つもありません"] };
  }

  // 応募導線フィールドの安全性は公開時にも必ず確認する。
  const fieldsResult = validateApplyActionFields(flow);
  errors.push(...fieldsResult.errors);

  const startNodes = nodes.filter((n) => n.type === "start");
  if (startNodes.length !== 1) {
    errors.push(`開始ノード(start)は1つだけ必要です（現在${startNodes.length}個）`);
  }

  const idSet = new Set(nodes.map((n) => n.id));
  if (idSet.size !== nodes.length) {
    errors.push("ノードIDが重複しています");
  }

  const nextIdsOf = (n: FlowNode): string[] => {
    const ids: string[] = [];
    if (n.nextNodeId) ids.push(n.nextNodeId);
    if (n.options) ids.push(...n.options.map((o) => o.nextNodeId));
    return ids;
  };

  for (const node of nodes) {
    for (const nextId of nextIdsOf(node)) {
      if (!idSet.has(nextId)) {
        errors.push(`ノード「${node.id}」が存在しないノード「${nextId}」を参照しています`);
      }
    }
  }

  // apply_action（4方式いずれか）もendと同じく「終端」として扱う。
  const isTerminal = (n: FlowNode) => n.type === "end" || n.type === "apply_action";
  const terminalNodes = nodes.filter(isTerminal);
  if (terminalNodes.length === 0) {
    errors.push("終了ノード(end)または応募導線ノード(apply_action)が1つもありません");
  }

  // startから到達可能なノードをたどり、終端への到達性とループを確認する。
  if (startNodes.length === 1) {
    const start = startNodes[0];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    let reachesTerminal = false;
    let sawCycle = false;
    const visiting = new Set<string>();

    const dfs = (id: string) => {
      if (visiting.has(id)) {
        sawCycle = true;
        return;
      }
      if (visited.has(id)) return;
      visiting.add(id);
      visited.add(id);
      const node = byId.get(id);
      if (node) {
        if (isTerminal(node)) reachesTerminal = true;
        for (const nextId of nextIdsOf(node)) {
          if (byId.has(nextId)) dfs(nextId);
        }
      }
      visiting.delete(id);
    };
    dfs(start.id);

    if (!reachesTerminal) {
      errors.push("開始ノードから終了・応募導線ノードに到達できる経路がありません");
    }
    if (sawCycle) {
      errors.push("フローの中に無限ループになる経路があります");
    }
  }

  return { ok: errors.length === 0, errors };
}
