import { ChecklistResult } from "./checklistItems";

export function buildPatrolReportTemplate(results: ChecklistResult[]): string {
  const lines: string[] = [];

  for (const item of results) {
    const statusText = item.status === "ok" ? "異常なし" : "要確認";
    // ラベルを2回書かず、コメントは同じ行に(要確認かつコメントがある時だけ)括弧書きで添える
    const comment = item.status === "needsAttention" && item.comment ? `（${item.comment}）` : "";
    lines.push(`${item.label}: ${statusText}${comment}`);
  }
  // lines = [
  //   "外壁: 異常なし",
  //   "屋根: 異常なし",
  //   "庭・雑草: 要確認（雑草が伸びています）",
  //   "郵便受け: 異常なし",
  //   "施錠確認: 異常なし",
  // ]
  return lines.join("\n");
}
