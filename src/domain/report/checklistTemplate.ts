import { ChecklistResult } from "./checklistItems";

export function buildPatrolReportTemplate(results: ChecklistResult[]): string {
  const lines: string[] = [];

  for (const item of results) {
    const statusText = item.status === "ok" ? "異常なし" : "要確認";
    lines.push(`${item.label}: ${statusText}`);
    if (item.status === "needsAttention" && item.comment) {
      lines.push(`${item.label}: ${item.comment}`);
    }
  }
  // 要確認の項目だけ、コメントの分だけ1行多くなる
  // lines = [
  //   "外壁: 異常なし",
  //   "屋根: 異常なし",
  //   "庭・雑草: 要確認",
  //   "庭・雑草: 雑草が伸びています",
  //   "郵便受け: 異常なし",
  //   "施錠確認: 異常なし",
  // ]
  return lines.join("\n");
}
