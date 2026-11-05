// 選択式フローの公開前検証。基本設計書5章「公開前検証：開始ノードが一つ、
// 参照切れなし、無限ループ禁止、終了導線あり」を実装する。
// P1時点のフローJSONの想定形:
// { nodes: [{ id, type: "start"|"choice"|"text_input"|"contact_form"|"notice"|"end",
//             text?, nextNodeId?, options?: [{ label, nextNodeId }] }] }

export interface FlowNode {
  id: string;
  type: "start" | "choice" | "text_input" | "contact_form" | "notice" | "end";
  text?: string;
  nextNodeId?: string;
  options?: { label: string; nextNodeId: string }[];
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

  const endNodes = nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    errors.push("終了ノード(end)が1つもありません");
  }

  // startから到達可能なノードをたどり、end到達性とループを確認する。
  if (startNodes.length === 1) {
    const start = startNodes[0];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    let reachesEnd = false;
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
        if (node.type === "end") reachesEnd = true;
        for (const nextId of nextIdsOf(node)) {
          if (byId.has(nextId)) dfs(nextId);
        }
      }
      visiting.delete(id);
    };
    dfs(start.id);

    if (!reachesEnd) {
      errors.push("開始ノードから終了ノードに到達できる経路がありません");
    }
    if (sawCycle) {
      errors.push("フローの中に無限ループになる経路があります");
    }
  }

  return { ok: errors.length === 0, errors };
}
